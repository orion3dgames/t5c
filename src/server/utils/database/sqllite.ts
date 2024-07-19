import Logger from "../Logger";
import sqlite3 from "sqlite3";
import fs from "fs";

export class DB_SQLLITE {
    db;

    constructor() {}

    async init(config) {
        let dbFilePath = process.env.DATABASE_PATH || "./database.db";
        this.db = new sqlite3.Database(dbFilePath, (err: any) => {
            if (err) {
                Logger.error("[database] Could not connect to database: " + dbFilePath, err);
            } else {
                Logger.info("[database] Connected to database: " + dbFilePath);
            }
        });
    }

    async createDatabase() {
        let sql = fs.readFileSync("./database/sqllite.sql", { encoding: "utf8" });
        let splitCharacter = ");";

        // Convert the SQL string to array so that you can run them one at a time.
        // You can split the strings using the query delimiter i.e. `;` in // my case I used `);` because some data in the queries had `;`.
        const dataArr = sql.toString().split(splitCharacter);

        // db.serialize ensures that your queries are one after the other depending on which one came first in your `dataArr`
        this.db.serialize(() => {
            // db.run runs your SQL query against the DB
            this.db.run("PRAGMA foreign_keys=OFF;");
            this.db.run("BEGIN TRANSACTION;");
            // Loop through the `dataArr` and db.run each query
            dataArr.forEach((query) => {
                if (query) {
                    // Add the delimiter back to each query before you run them
                    // In my case the it was `);`
                    query += splitCharacter;
                    this.db.run(query, (err) => {
                        if (err) throw err;
                    });
                }
            });
            this.db.run("COMMIT;");
        });
    }

    async get(sql: string, params = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: any, result: []) => {
                if (err) {
                    console.log("Error running sql: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async all(sql: string, params = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: any, rows: []) => {
                if (err) {
                    console.log("Error running sql: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async run(sql: string, params = []) {
        //console.log(sql, params);
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err: any, result: any) {
                if (err) {
                    console.log("Error running sql " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    //console.log("[RUN] results", this);
                    resolve(this.lastID);
                }
            });
        });
    }
}
