import sqlite3 from "sqlite3";
import Logger from "./utils/Logger";
import { nanoid } from "nanoid";
import { PlayerCharacter, PlayerSlots, PlayerUser } from "../shared/types";
import { ParsedQs } from "qs";
import { InventorySchema } from "./rooms/schema/player/InventorySchema";
import { AbilitySchema } from "./rooms/schema/player/AbilitySchema";
import { EquipmentSchema, HotbarSchema, PlayerSchema, QuestSchema } from "./rooms/schema";
import { MapSchema } from "@colyseus/schema/lib/types/MapSchema";

class Database {
    private db;
    private debug: boolean = true;
    private _config;

    constructor(config) {
        this._config = config;
    }

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
            "race" TEXT,
            "material" INTEGER DEFAULT 0,
            "head" TEXT,
            "location" TEXT,
            "level" int,
            "experience" int,
            "health" int,
            "mana" int,
            "x" REAL DEFAULT 0.0,
            "y"	REAL DEFAULT 0.0,
            "z"	REAL DEFAULT 0.0, 
            "rot" REAL DEFAULT 0.0,
            "gold" INTEGER DEFAULT 0,
            "strength" INTEGER DEFAULT 0,
            "endurance" INTEGER DEFAULT 0,
            "agility" INTEGER DEFAULT 0,
            "intelligence" INTEGER DEFAULT 0,
            "wisdom" INTEGER DEFAULT 0,
            "points" INTEGER DEFAULT 0,
            "online" INTEGER DEFAULT 0
        );`;

        const playerInventorySql = `CREATE TABLE IF NOT EXISTS "character_inventory" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "order" INTEGER,
            "qty" INTEGER,
            "key" TEXT
        )`;

        const playerHotBarSql = `CREATE TABLE IF NOT EXISTS "character_hotbar" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "type" TEXT,
            "key" TEXT,
            "digit" INTEGER DEFAULT 0
        )`;

        const playerAbilitySql = `CREATE TABLE IF NOT EXISTS "character_abilities" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "key" TEXT
        )`;

        const playerEquipmentSql = `CREATE TABLE IF NOT EXISTS "character_equipment" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "slot" INTEGER,
            "key" TEXT
        )`;

        const playerQuestsSql = `CREATE TABLE IF NOT EXISTS "character_quests" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "owner_id" INTEGER,
            "key" TEXT,
            "status" INTEGER DEFAULT 0,
            "qty" INTEGER DEFAULT 0,
            UNIQUE("id")
        );`;

        this.db.serialize(() => {
            Logger.info("[database] Creating default database structure.");
            this.run(usersSql);
            this.run(playersSql);
            this.run(playerInventorySql);
            this.run(playerAbilitySql);
            this.run(playerEquipmentSql);
            this.run(playerQuestsSql);
            this.run(playerHotBarSql);

            Logger.info("[database] Reset all characters to offline. ");
            this.run(`UPDATE characters SET online=0 ;`);
        });
    }

    async connectDatabase() {
        let dbFilePath = this._config.databaseLocation;
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
                        //console.log("sql: " + sql, params);
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
                        //console.log("sql: " + sql, params);
                    }
                    resolve(rows);
                }
            });
        });
    }

    async run(sql: string, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err: any) {
                if (err) {
                    console.log("Error running sql " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    //console.log("sql: " + sql, params, err);
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
        let c = (await this.run(`INSERT INTO users (username, password, token) VALUES (?,?,?)`, [username, password, token])) as any;
        return await this.getUserById(c.id);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getCharacter(id: number) {
        let character = await this.get(`SELECT * FROM characters WHERE id=?;`, [id]);
        character.abilities = await this.all(`SELECT CA.* FROM character_abilities CA WHERE CA.owner_id=? ORDER BY CA.id ASC;`, [id]);
        character.hotbar = await this.all(`SELECT CA.* FROM character_hotbar CA WHERE CA.owner_id=? ORDER BY CA.digit ASC;`, [id]);
        character.inventory = await this.all(`SELECT CI.* FROM character_inventory CI WHERE CI.owner_id=?;`, [id]);
        character.equipment = await this.all(`SELECT CI.* FROM character_equipment CI WHERE CI.owner_id=?;`, [id]);
        character.quests = await this.all(`SELECT CI.* FROM character_quests CI WHERE CI.owner_id=? AND CI.status=?;`, [id, 0]);
        return character;
    }

    generateStatPoint() {
        return Math.trunc(70 / 5 + Math.random() * 10);
    }

    async createCharacter(token, name, race, material, head) {
        let user = await this.getUserByToken(token);
        const sql = `INSERT INTO characters (
            "user_id", "name", "race", "material", "head",
            "strength", "endurance", "agility", "intelligence", "wisdom", 
            "location","x","y","z","rot","level","experience","health", "mana", "gold", "points") 
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,

                ?,
                ?,
                ?,
                ?,
                ?,

                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                
                ?,
                ?,
                ?,
                ?
            );`;
        let c = await (<any>this.run(sql, [
            user.id,
            name,
            race,
            material,
            head,
            20,
            20,
            20,
            20,
            20,
            "training_ground",
            //"lh_town",

            "6.18",
            "0.1",
            "-11.21",
            "2.08",

            "1",
            "0",

            "5000",
            "5000",
            "50000",
            "50",
        ]));

        // add default abilities
        let abilities = [{ key: "base_attack" }, { key: "fire_dart" }, { key: "fire_dart" }];
        abilities.forEach((ability) => {
            const sql_abilities = `INSERT INTO character_abilities ("owner_id", "key") VALUES ("${c.id}", "${ability.key}")`;
            this.run(sql_abilities);
        });

        // add default hotbar
        let hotbar = [
            { digit: 1, type: "ability", key: "base_attack" },
            { digit: 2, type: "ability", key: "fire_dart" },
            { digit: 3, type: "ability", key: "poison" },
            { digit: 4, type: "ability", key: "light_heal" },
            { digit: 8, type: "item", key: "potion_small_red" },
            { digit: 9, type: "item", key: "potion_small_blue" },
        ];
        hotbar.forEach((item) => {
            const sql = `INSERT INTO character_hotbar ("owner_id", "digit", "type", "key") VALUES ("${c.id}", "${item.digit}", "${item.type}", "${item.key}")`;
            this.run(sql);
        });

        // default equipment
        let equipment = [{ key: "sword_01", slot: PlayerSlots.WEAPON }];
        equipment.forEach((e) => {
            const sql_equip1 = `INSERT INTO character_equipment ("owner_id", "slot", "key") VALUES ("${c.id}", "${e.slot}", "${e.key}")`;
            this.run(sql);
        });

        // default quests
        const sql_quests = `INSERT INTO character_quests ("owner_id", "key", "status", "qty") VALUES ("${c.id}", "LH_DANGEROUS_ERRANDS_01", "0", "5")`;
        //this.run(sql_quests);

        // add default items
        let items = [
            { qty: 5, key: "potion_small_red" },
            { qty: 5, key: "potion_small_blue" },
            { qty: 1, key: "sword_01" },
            { qty: 1, key: "armor_01" },
            { qty: 1, key: "armor_02" },
            { qty: 1, key: "amulet_01" },
        ];
        items.forEach((item) => {
            const sql = `INSERT INTO character_inventory ("owner_id", "qty", "order", "key") VALUES ("${c.id}", "${item.qty}", "1", "${item.key}")`;
            this.run(sql);
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
        if (data.maxHealth) {
            p["health"] = data.maxHealth;
        }
        if (data.maxMana) {
            p["mana"] = data.maxMana;
        }

        if (data.player_data) {
            p["gold"] = data.player_data.gold ?? 0;
            p["experience"] = data.player_data.experience ?? 0;
            p["points"] = data.player_data.points ?? 0;
            p["strength"] = data.player_data.strength ?? 0;
            p["endurance"] = data.player_data.endurance ?? 0;
            p["agility"] = data.player_data.agility ?? 0;
            p["intelligence"] = data.player_data.intelligence ?? 0;
            p["wisdom"] = data.player_data.wisdom ?? 0;
        }

        let sql = "UPDATE characters SET ";

        for (let i in p) {
            const el = p[i];
            sql += i + "='" + el + "',";
        }
        sql = sql.slice(0, -1);
        sql += " WHERE id= " + character_id;
        //console.log(sql);
        return this.run(sql, []);
    }

    // removes and saves character hotbar
    // terrible way to do it
    async saveHotbar(character_id: number, hotbar: MapSchema<HotbarSchema, string>) {
        const sql = `DELETE FROM character_hotbar WHERE owner_id=?;`;
        await this.run(sql, [character_id]);
        if (hotbar && hotbar.size > 0) {
            let sqlItems = `INSERT INTO character_hotbar (owner_id, digit, type, key) VALUES `;
            hotbar.forEach((element: HotbarSchema) => {
                sqlItems += ` ('${character_id}', '${element.digit}', '${element.type}', '${element.key}'),`;
            });
            sqlItems = sqlItems.slice(0, -1);
            return await this.run(sqlItems);
        }
    }

    // removes and saves character items
    // terrible way to do it
    async saveItems(character_id: number, items: MapSchema<InventorySchema, string>) {
        const sql = `DELETE FROM character_inventory WHERE owner_id=?;`;
        await this.run(sql, [character_id]);
        if (items && items.size > 0) {
            let sqlItems = `INSERT INTO character_inventory (owner_id, qty, key) VALUES `;
            items.forEach((element: InventorySchema) => {
                sqlItems += ` ('${character_id}', '${element.qty}', '${element.key}'),`;
            });
            sqlItems = sqlItems.slice(0, -1);
            return await this.run(sqlItems);
        }
    }

    // removes and saves character abilities
    // terrible way to do it
    async saveAbilities(character_id: number, abilities: MapSchema<AbilitySchema, string>) {
        const sql = `DELETE FROM character_abilities WHERE owner_id=?;`;
        await this.run(sql, [character_id]);
        if (abilities && abilities.size > 0) {
            let sqlItems = `INSERT INTO character_abilities (owner_id, key) VALUES `;
            abilities.forEach((element: AbilitySchema) => {
                sqlItems += ` ('${character_id}', '${element.key}'),`;
            });
            sqlItems = sqlItems.slice(0, -1);
            return await this.run(sqlItems);
        }
    }

    // removes and saves character equipment
    // terrible way to do it
    async saveEquipment(character_id: number, equipments: MapSchema<EquipmentSchema, string>) {
        const sql = `DELETE FROM character_equipment WHERE owner_id=?;`;
        await this.run(sql, [character_id]);
        if (equipments && equipments.size > 0) {
            let sqlString = `INSERT INTO character_equipment (owner_id, key, slot) VALUES `;
            equipments.forEach((element: EquipmentSchema) => {
                sqlString += ` ('${character_id}', '${element.key}', '${element.slot}'),`;
            });
            sqlString = sqlString.slice(0, -1);
            return await this.run(sqlString);
        }
    }

    // removes and saves quests
    // terrible way to do it
    async saveQuests(character_id: number, quests: MapSchema<QuestSchema, string>) {
        const sql = `DELETE FROM character_quests WHERE owner_id=?;`;
        await this.run(sql, [character_id]);
        if (quests && quests.size > 0) {
            let sqlString = `INSERT INTO character_quests (owner_id, key, status, qty) VALUES `;
            quests.forEach((element: QuestSchema) => {
                sqlString += ` ('${character_id}', '${element.key}', '${element.status}', '${element.qty}'),`;
            });
            sqlString = sqlString.slice(0, -1);
            return await this.run(sqlString);
        }
    }

    async toggleOnlineStatus(character_id: number, online: number) {
        const sql = `UPDATE characters SET online=? WHERE id=? ;`;
        return this.run(sql, [online, character_id]);
    }

    async doesUserNameExists(name: string) {
        const sql = `SELECT COUNT(id) as count FROM users WHERE username=? ;`;
        return this.get(sql, [name]);
    }
}

export { Database };
