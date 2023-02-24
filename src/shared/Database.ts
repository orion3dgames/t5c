import sqlite3 from "sqlite3";
import Logger from "./Logger";
import { nanoid } from "nanoid";
import { PlayerCharacter, PlayerUser } from "./types";
import { ParsedQs } from "qs";
import Config from "./Config";
import { dataDB } from "./Data/dataDB";

class Database {
    private db;
    private debug: boolean = true;

    constructor() {}

    async initDatabase() {
        this.db = await this.connectDatabase();
    }

    async createDatabase() {
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
            "mana" int,
            "x" REAL DEFAULT 0.0,
            "y"	REAL DEFAULT 0.0,
            "z"	REAL DEFAULT 0.0, 
            "rot" REAL DEFAULT 0.0,
            "gold" INTEGER,
            "online" INTEGER
        );`;

        const playerInventorySql = `CREATE TABLE IF NOT EXISTS "character_inventory" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "qty" INTEGER,
            "key" TEXT
        )`;

        const playerAbilitySql = `CREATE TABLE IF NOT EXISTS "character_abilities" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "ability_id" INTEGER,
            "digit" INTEGER,
            "key" TEXT
        )`;

        /*
        const abilitiesSql = `CREATE TABLE IF NOT EXISTS "abilities" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "key" TEXT NOT NULL UNIQUE,
            "label" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "icon" TEXT NOT NULL,
            "sound" TEXT NOT NULL,
            "castSelf" numeric DEFAULT 0,
            "castTime" numeric DEFAULT 0, 
            "cooldown" numeric DEFAULT 0,
            "repeat" numeric DEFAULT 0,
            "repeatInterval" numeric DEFAULT 0,
            "range" numeric DEFAULT 0, 
            "minRange" numeric DEFAULT 0,
            "effect" TEXT DEFAULT '{}',
            "casterPropertyAffected" TEXT DEFAULT '{}',
            "targetPropertyAffected" TEXT DEFAULT '{}',
            "requiredToLearn" TEXT DEFAULT '{}'
        )`;

        const itemsSql = `CREATE TABLE IF NOT EXISTS "items" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "key" TEXT NOT NULL UNIQUE,
            "label" TEXT NOT NULL,
            "description" TEXT NOT NULL
        )`;*/

        this.db.serialize(() => {
            Logger.info("[database] Creating default database structure.");
            this.run(usersSql);
            this.run(playersSql);
            this.run(playerInventorySql);
            this.run(playerAbilitySql);

            /*
            // insert some items
            this.run(`DELETE FROM "items" where id > 0`);
            this.run(`INSERT INTO items ("key","label","description") VALUES ("pear","Pear","A delicious golden fruit.")`);
            this.run(`INSERT INTO items ("key","label","description") VALUES ("apple","Apple","One of the juciest fruit in the 5th continent.")`);

            // insert some abilities
            this.run(`DELETE FROM "abilities" where id > 0`);
            for (let i in AbilitiesDB) {
                let ability = AbilitiesDB[i];
                let sql = `INSERT INTO abilities (`;
                for (let a in ability) {
                    sql += `"${a}",`;
                }
                sql = sql.slice(0, -1);
                sql += `) VALUES (`;
                for (let a in ability) {
                    let el = ability[a];
                    if (typeof el === "object") {
                        el = encodeURI(JSON.stringify(el));
                    }
                    sql += `"${el}",`;
                }
                sql = sql.slice(0, -1);
                sql += `)`;
                this.run(sql);
            }*/

            Logger.info("[database] Reset all characters to offline. ");
            this.run(`UPDATE characters SET online=0 ;`);
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

    get(sql: string, params = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: any, result: []) => {
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

    all(sql: string, params = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: any, rows: []) => {
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
                    //console.log("sql: " + sql, params, data, err);
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getUser(username: string | string[] | ParsedQs | ParsedQs[], password: string | string[] | ParsedQs | ParsedQs[]) {
        const sql = `SELECT * FROM users WHERE username=? AND password=?;`;
        return await this.get(sql, [username, password]);
    }

    async getUserWithToken(token: string | string[] | ParsedQs | ParsedQs[]) {
        const sql = `SELECT * FROM users WHERE token=?;`;
        return await this.get(sql, [token]);
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
        let character = await this.get(`SELECT * FROM characters WHERE id=?;`, [id]);
        character.abilities = await this.all(`SELECT CA.* FROM character_abilities CA WHERE CA.owner_id=? ORDER BY CA.digit ASC;`, [id]);
        character.inventory = await this.all(`SELECT CI.* FROM character_inventory CI WHERE CI.owner_id=?;`, [id]);
        return character;
    }

    async createCharacter(token, name) {
        // create a character
        let raceData = dataDB.get("race", "player_hobbit");
        let user = await this.getUserByToken(token);
        let defaultLocation = dataDB.get("location", Config.initialLocation);
        const sql = `INSERT INTO characters ("user_id", "name","location","x","y","z","rot","level","experience","health", "mana") VALUES (
            "${user.id}",
            "${name}",
            "${defaultLocation.key}",
            "${defaultLocation.spawnPoint.x}",
            "${defaultLocation.spawnPoint.y}",
            "${defaultLocation.spawnPoint.z}",
            "${defaultLocation.spawnPoint.rot}",
            "1",
            "0",
            "${raceData.baseHealth}",
            "${raceData.baseMana}"
        );`;
        let c = await (<any>this.run(sql));

        // add default abilities
        let abilities = [
            { digit: 1, key: "basic_attack" },
            { digit: 2, key: "fireball" },
            { digit: 3, key: "poisonball" },
            { digit: 4, key: "heal" },
        ];
        abilities.forEach((ability) => {
            const sql_abilities = `INSERT INTO character_abilities ("owner_id", "digit", "key") VALUES ("${c.id}", "${ability.digit}", "${ability.key}")`;
            this.run(sql_abilities);
        });

        return await this.getCharacter(c.id);
    }

    async updateCharacter(character_id: number, data) {
        let p = [];
        p["location"] = data.location;
        p["x"] = data.x;
        p["y"] = data.y;
        p["z"] = data.z;
        p["rot"] = data.rot;
        if (data.level) {
            p["level"] = data.level;
        }
        if (data.experience) {
            p["experience"] = data.experience;
        }
        if (data.health) {
            p["health"] = data.health;
        }
        if (data.mana) {
            p["mana"] = data.mana;
        }
        if (data.gold) {
            p["gold"] = data.gold;
        }

        let sql = "UPDATE characters SET ";

        for (let i in p) {
            const el = p[i];
            sql += i + "='" + el + "',";
        }
        sql = sql.slice(0, -1);
        sql += " WHERE id= " + character_id;
        return this.run(sql, []);
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
