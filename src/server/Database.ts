import Logger from "./utils/Logger";
import { DB_MYSQL } from "./utils/database/mysql";
import { DB_SQLLITE } from "./utils/database/sqllite";
import { nanoid } from "nanoid";
import { PlayerCharacter, PlayerSlots, PlayerUser } from "../shared/types";
import { ParsedQs } from "qs";
import { InventorySchema } from "./rooms/schema/player/InventorySchema";
import { AbilitySchema } from "./rooms/schema/player/AbilitySchema";
import { EquipmentSchema, HotbarSchema, PlayerSchema, QuestSchema } from "./rooms/schema";
import { MapSchema } from "@colyseus/schema/lib/types/MapSchema";
import { Config } from "../shared/Config";

class Database {
    private debug: boolean = true;
    private _config: Config;
    private querier: DB_MYSQL | DB_SQLLITE;

    constructor(config) {
        this._config = config;
    }

    async init() {
        Logger.info("[database] Trying to connect to database");

        if (this._config.database === "mysql") {
            this.querier = new DB_MYSQL();
        } else if (this._config.database === "sqllite") {
            this.querier = new DB_SQLLITE();
        } else {
            this.querier = new DB_SQLLITE();
        }

        await this.querier.init(this._config);

        Logger.info("[database] Connected to database");
    }

    async create() {
        await this.querier.createDatabase();
        Logger.info("[database] imported default mysql structure");
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getUser(username: string | string[] | ParsedQs | ParsedQs[], password: string | string[] | ParsedQs | ParsedQs[]) {
        const sql = `SELECT * FROM users WHERE username=? AND password=?;`;
        return await this.querier.get(sql, [username, password]);
    }

    async getUserWithToken(token: string | string[] | ParsedQs | ParsedQs[]) {
        const sql = `SELECT * FROM users WHERE token=?;`;
        return await this.querier.get(sql, [token]);
    }

    async getUserById(user_id: number): Promise<PlayerUser> {
        const sql = `SELECT * FROM users WHERE id=?;`;
        let user = await (<any>this.querier.get(sql, [user_id]));
        user.characters = await this.getCharactersForUser(user_id);
        return user;
    }

    async getUserByToken(token: any): Promise<PlayerUser> {
        const sql = `SELECT * FROM users WHERE token=?;`;
        return <PlayerUser>await this.querier.get(sql, [token]);
    }

    async getCharactersForUser(user_id: number): Promise<PlayerCharacter[]> {
        const sql = `SELECT * FROM characters WHERE user_id=?;`;
        return <PlayerCharacter[]>await this.querier.all(sql, [user_id]);
    }

    async hasUser(username: string) {
        const sql = `SELECT * FROM users WHERE username=?;`;
        return await this.querier.get(sql, [username]);
    }

    async refreshToken(user_id: number) {
        let token = nanoid();
        const sql = `UPDATE users SET token=? WHERE id=?;`;
        await this.querier.run(sql, [token, user_id]);
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
        let lastId = await this.querier.run(`INSERT INTO users (username, password, token) VALUES (?,?,?)`, [username, password, token]);
        return await this.getUserById(lastId);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    async getCharacter(id: number) {
        let character = await this.querier.get(`SELECT * FROM characters WHERE id=?;`, [id]);
        character.abilities = await this.querier.all(`SELECT CA.* FROM character_abilities CA WHERE CA.owner_id=? ORDER BY CA.id ASC;`, [id]);
        character.hotbar = await this.querier.all(`SELECT CA.* FROM character_hotbar CA WHERE CA.owner_id=? ORDER BY CA.digit ASC;`, [id]);
        character.inventory = await this.querier.all(`SELECT CI.* FROM character_inventory CI WHERE CI.owner_id=?;`, [id]);
        character.equipment = await this.querier.all(`SELECT CI.* FROM character_equipment CI WHERE CI.owner_id=?;`, [id]);
        character.quests = await this.querier.all(`SELECT CI.* FROM character_quests CI WHERE CI.owner_id=? AND CI.status=?;`, [id, 0]);
        return character;
    }

    generateStatPoint() {
        return Math.trunc(70 / 5 + Math.random() * 10);
    }

    async createCharacter(token, name, race, material, head) {
        let user = await this.getUserByToken(token);
        let characterId = await (<any>this.querier.run(
            `INSERT INTO characters (
                    user_id, 
                    name, 
                    race, 
                    material, 
                    head, 
                    strength, 
                    endurance, 
                    agility, 
                    intelligence, 
                    wisdom, 
                    location, 
                    x, 
                    y, 
                    z, 
                    rot, 
                    level, 
                    experience, 
                    health, 
                    mana, 
                    gold, 
                    points 
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `,
            [
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
                //"training_ground",
                "lh_town",

                6.18,
                0.1,
                -11.21,
                1.72,

                1,
                0,

                1000,
                1000,
                50000,
                50,
            ]
        ));

        // add default abilities
        let abilities = [{ key: "base_attack" }, { key: "fire_dart" }];
        for (const ability of abilities) {
            await this.querier.run("INSERT INTO character_abilities (`owner_id`, `key`) VALUES (?,?);", [characterId, ability.key]);
        }

        // add default hotbar
        let hotbar = [
            { digit: 1, type: "ability", key: "base_attack" },
            { digit: 2, type: "ability", key: "slice_attack" },
            { digit: 3, type: "ability", key: "fire_dart" },
            { digit: 4, type: "ability", key: "poison" },
            { digit: 5, type: "ability", key: "light_heal" },
            { digit: 8, type: "item", key: "potion_small_red" },
            { digit: 9, type: "item", key: "potion_small_blue" },
        ];
        for (const item of hotbar) {
            await this.querier.run("INSERT INTO character_hotbar (`owner_id`, `digit`, `type`, `key`) VALUES (?,?,?,?);", [
                characterId,
                item.digit,
                item.type,
                item.key,
            ]);
        }

        // default equipment
        let equipment = [{ key: "sword_01", slot: PlayerSlots.WEAPON }];
        for (const e of equipment) {
            await this.querier.run("INSERT INTO character_equipment (`owner_id`,`slot`, `key`) VALUES (?,?,?) ", [characterId, e.slot, e.key]);
        }

        // default quests
        //const sql_quests = `INSERT INTO character_quests ("owner_id", "key", "status", "qty") VALUES ("${c.id}", "LH_DANGEROUS_ERRANDS_01", "0", "5")`;
        //this.run(sql_quests);

        // add default items
        let items = [
            { qty: 5, key: "potion_small_red" },
            { qty: 5, key: "potion_small_blue" },
            //{ qty: 1, key: "cape_01" },
            { qty: 1, key: "sword_01" },
            { qty: 1, key: "armor_01" },
            { qty: 1, key: "armor_02" },
            { qty: 1, key: "amulet_01" },
        ];
        for (const item of items) {
            const sql = "INSERT INTO character_inventory (`owner_id`, `qty`, `order`, `key`) VALUES (?,?,?,?)";
            this.querier.run(sql, [characterId, item.qty, 1, item.key]);
        }

        return await this.getCharacter(characterId);
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
        return this.querier.run(sql, []);
    }

    // removes and saves character hotbar
    // terrible way to do it
    async saveHotbar(character_id: number, hotbar: MapSchema<HotbarSchema, string>) {
        const sql = `DELETE FROM character_hotbar WHERE owner_id=?;`;
        await this.querier.run(sql, [character_id]);
        if (hotbar && hotbar.size > 0) {
            hotbar.forEach((item) => {
                this.querier.run("INSERT INTO character_hotbar (`owner_id`, `digit`, `type`, `key`) VALUES (?,?,?,?);", [
                    character_id,
                    item.digit,
                    item.type,
                    item.key,
                ]);
            });
        }
    }

    // removes and saves character items
    // terrible way to do it
    async saveItems(character_id: number, items: MapSchema<InventorySchema, string>) {
        const sql = `DELETE FROM character_inventory WHERE owner_id=?;`;
        await this.querier.run(sql, [character_id]);
        if (items && items.size > 0) {
            let sqlItems = "INSERT INTO character_inventory (`owner_id`, `qty`, `key`) VALUES ";
            items.forEach((element: InventorySchema) => {
                sqlItems += ` ('${character_id}', '${element.qty}', '${element.key}'),`;
            });
            sqlItems = sqlItems.slice(0, -1);
            return await this.querier.run(sqlItems);
        }
    }

    // removes and saves character abilities
    // terrible way to do it
    async saveAbilities(character_id: number, abilities: MapSchema<AbilitySchema, string>) {
        const sql = `DELETE FROM character_abilities WHERE owner_id=?;`;
        await this.querier.run(sql, [character_id]);
        if (abilities && abilities.size > 0) {
            let sqlItems = "INSERT INTO character_abilities (`owner_id`, `key`) VALUES ";
            abilities.forEach((element: AbilitySchema) => {
                sqlItems += ` ('${character_id}', '${element.key}'),`;
            });
            sqlItems = sqlItems.slice(0, -1);
            return await this.querier.run(sqlItems);
        }
    }

    // removes and saves character equipment
    // terrible way to do it
    async saveEquipment(character_id: number, equipments: MapSchema<EquipmentSchema, string>) {
        const sql = `DELETE FROM character_equipment WHERE owner_id=?;`;
        await this.querier.run(sql, [character_id]);
        if (equipments && equipments.size > 0) {
            let sqlString = "INSERT INTO character_equipment (`owner_id`, `key`, `slot`) VALUES ";
            equipments.forEach((element: EquipmentSchema) => {
                sqlString += ` ('${character_id}', '${element.key}', '${element.slot}'),`;
            });
            sqlString = sqlString.slice(0, -1);
            return await this.querier.run(sqlString);
        }
    }

    // removes and saves quests
    // terrible way to do it
    async saveQuests(character_id: number, quests: MapSchema<QuestSchema, string>) {
        const sql = `DELETE FROM character_quests WHERE owner_id=?;`;
        await this.querier.run(sql, [character_id]);
        if (quests && quests.size > 0) {
            let sqlString = `INSERT INTO character_quests (owner_id, key, status, qty) VALUES `;
            quests.forEach((element: QuestSchema) => {
                sqlString += ` ('${character_id}', '${element.key}', '${element.status}', '${element.qty}'),`;
            });
            sqlString = sqlString.slice(0, -1);
            return await this.querier.run(sqlString);
        }
    }

    async toggleOnlineStatus(character_id: number, online: number) {
        const sql = `UPDATE characters SET online=? WHERE id=? ;`;
        return this.querier.run(sql, [online, character_id]);
    }

    async doesUserNameExists(name: string) {
        const sql = `SELECT COUNT(id) as count FROM users WHERE username=? ;`;
        return this.querier.get(sql, [name]);
    }
}

export { Database };
