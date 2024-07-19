import Logger from "../Logger";
import fs from "fs";

import mysql, { ConnectionOptions } from "mysql2/promise";

export class DB_MYSQL {
    db;

    constructor() {}

    async init(config) {
        this.db = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            database: process.env.DATABASE_DB,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            decimalNumbers: true,
        });
        Logger.info("[database] Connected to database");
    }

    // create tables in database
    async createDatabase() {
        let sql = fs.readFileSync("./database/mysql.sql", { encoding: "utf8" });
        let splitCharacter = ";";
        const dataArr = sql.toString().split(splitCharacter);
        for (let query of dataArr) {
            if (query) {
                query += splitCharacter;
                await this.query(query, []);
            }
        }
    }

    async query(sql: string, params = []) {
        let [results] = await this.db.query(sql, params, (err: any) => {
            if (err) {
                console.log("Error running sql: " + sql);
                console.log(err);
            }
        });
        return results;
    }

    async get(sql: string, params = []) {
        let [result] = await this.db.query(sql, params, (err: any, result: []) => {
            if (err) {
                console.log("Error running sql: " + sql);
                console.log(err);
            }
        });
        return result[0];
    }

    async all(sql: string, params = []) {
        let [result] = await this.db.execute(sql, params, (err: any, result: []) => {
            if (err) {
                console.log("Error running sql: " + sql);
                console.log(err);
            }
        });
        return result;
    }

    async run(sql: string, params: {} | [] = []) {
        let [result] = await this.db.execute(sql, params, function (err: any) {
            if (err) {
                console.log("Error running sql " + sql);
                console.log(err);
            }
        });
        let resultJson = JSON.parse(JSON.stringify(result));
        return resultJson.insertId;
    }
}
