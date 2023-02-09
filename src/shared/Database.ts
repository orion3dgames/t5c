import sqlite3 from "sqlite3";
import Logger from "./Logger";
import { nanoid } from "nanoid";
import { PlayerCharacter, PlayerUser } from "./types";
import { ParsedQs } from "qs";
import Config from "./Config";
import Locations from "./Data/Locations";
import { Races } from "./Entities/Common/Races";

class Database {
    private db;
    private debug: boolean = true;

    constructor() {
        this.getDatabase();
    }

    async getDatabase() {
        this.db = await this.connectDatabase();

        Logger.info("[database] Creating database.");

        const usersSql = `CREATE TABLE IF NOT EXISTS "users" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT,
      "token" TEXT
    );`;

        const playersSql = `CREATE TABLE IF NOT EXISTS "characters" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" INTEGER,
      "name" TEXT,
      "location" TEXT,
      "level" int,
      "experience" int,
      "health" int,
      "x" REAL DEFAULT 0.0,
      "y"	REAL DEFAULT 0.0,
      "z"	REAL DEFAULT 0.0, 
      "rot" REAL DEFAULT 0.0,
      "online" INTEGER
    );`;

        this.db.serialize(() => {
            Logger.info("[database] Creating default database structure.");
            this.run(usersSql);
            this.run(playersSql);

            Logger.info("[database] Reset all characters to offline. ");
            this.run(`UPDATE characters SET online=0 ;`);

            /*
      let req = this.run(`INSERT INTO users SET username=?, password=?, token=?`, ['test', 'test', 'test']);
      console.log(req);
      this.run(`INSERT INTO characters SET name=?, location=?, x=?, y=?, z=?, rot=?, level=?, experience=?, health=?`, 
        ['Orion', 'lh_town', 0,0,0,0,1,0,100]);
      */
        });
    }

    async connectDatabase() {
        let dbFilePath = Config.databaseLocation;
        return new sqlite3.Database(dbFilePath, (err: any) => {
            if (err) {
                Logger.error("[database] Could not connect to database: " + dbFilePath, err);
            } else {
                Logger.info("[database] Connected to database: " + dbFilePath);
            }
        });
    }

    get(sql: string, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: any, result: unknown) => {
                if (err) {
                    console.log("Error running sql: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    if (this.debug) {
                        console.log("sql: " + sql, params);
                    }
                    resolve(result);
                }
            });
        });
    }

    all(sql: string, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: any, rows: unknown) => {
                if (err) {
                    console.log("Error running sql: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    if (this.debug) {
                        console.log("sql: " + sql, params);
                    }
                    resolve(rows);
                }
            });
        });
    }

    run(sql: string, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err: any) {
                if (err) {
                    console.log("Error running sql " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    if (this.debug) {
                        console.log("sql: " + sql, params);
                    }
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getUser(
        username: string | string[] | ParsedQs | ParsedQs[],
        password: string | string[] | ParsedQs | ParsedQs[]
    ) {
        const sql = `SELECT * FROM users WHERE username=? AND password=?;`;
        return await this.get(sql, [username, password]);
    }

    async getUserById(user_id: number): Promise<PlayerUser> {
        const sql = `SELECT * FROM users WHERE id=?;`;
        let user = await (<any>this.get(sql, [user_id]));
        user.characters = await this.getCharactersForUser(user.id);
        return user;
    }

    async getUserByToken(token: any): Promise<PlayerUser> {
        const sql = `SELECT * FROM users WHERE token=?;`;
        return <PlayerUser>await this.get(sql, [token]);
    }

    async getCharactersForUser(user_id: number): Promise<PlayerCharacter[]> {
        const sql = `SELECT * FROM characters WHERE user_id=?;`;
        return <PlayerCharacter[]>await this.all(sql, [user_id]);
    }

    async hasUser(username: string) {
        const sql = `SELECT * FROM users WHERE username=?;`;
        return await this.get(sql, [username]);
    }

    async refreshToken(user_id: number) {
        let token = nanoid();
        const sql = `UPDATE users SET token=? WHERE id=?;`;
        await this.run(sql, [token, user_id]);
        let user = await this.getUserById(user_id);
        return user;
    }

    async checkToken(token: string): Promise<PlayerUser> {
        let user = await this.getUserByToken(token);
        if (user) {
            user.characters = await this.getCharactersForUser(user.id);
            return user;
        }
        return null;
    }

    async saveUser(username: string, password: string, token: string = nanoid()) {
        const sql = `INSERT INTO users ("username","password", "token") VALUES (
        "${username}", 
        "${password}", 
        "${token}" 
      );`;
        let c = await (<any>this.run(sql));
        return await this.getUserById(c.id);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getCharacter(id: number) {
        const sql = `SELECT * FROM characters WHERE id=?;`;
        return await this.get(sql, [id]);
    }

    async createCharacter(token, name) {
        let raceData = Races.get("player_hobbit");
        let user = await this.getUserByToken(token);
        let defaultLocation = Locations[Config.initialLocation];
        const sql = `INSERT INTO characters ("user_id", "name","location","x","y","z","rot","level","experience","health") VALUES (
        "${user.id}",
        "${name}",
        "${defaultLocation.key}",
        "${defaultLocation.spawnPoint.x}",
        "${defaultLocation.spawnPoint.y}",
        "${defaultLocation.spawnPoint.z}",
        "${defaultLocation.spawnPoint.rot}",
        "1",
        "0",
        "${raceData.maxHealth}"
      );`;
        let c = await (<any>this.run(sql));
        return await this.getCharacter(c.id);
    }

    async updateCharacter(character_id: number, data: { location: any; x: any; y: any; z: any; rot: any }) {
        const sql = `UPDATE characters SET location=?, x=?, y=?, z=?, rot=? WHERE id=? ;`;
        return this.run(sql, [data.location, data.x, data.y, data.z, data.rot, character_id]);
    }

    async toggleOnlineStatus(character_id: number, online: number) {
        const sql = `UPDATE characters SET online=? WHERE id=? ;`;
        return this.run(sql, [online, character_id]);
    }

    ////////////////// DEBUG ONLY

    async returnRandomUserAndChar() {
        const sql = `SELECT C.*, U.token, U.username, U.password from characters C LEFT JOIN users U ON U.id=C.user_id ORDER BY random() LIMIT 1;`;
        return this.get(sql, []);
    }
}

export default Database;
