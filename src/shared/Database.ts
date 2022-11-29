const sqlite3 = require('sqlite3');
const dbFilePath = './database.db';
import Logger from "./Logger";
import { nanoid } from 'nanoid';
import { PlayerCharacter, PlayerUser } from "./types";

class Database {

  private db: typeof sqlite3;

  constructor() {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        Logger.error("Could not connect to database: "+dbFilePath, err);
      } else {
        Logger.info("Connected to database: "+dbFilePath);
        this.create();
      }
    });
  }

  create() {

    const usersSql = `CREATE TABLE IF NOT EXISTS "users" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT,
      "token" TEXT
    );` 

    const playersSql = `CREATE TABLE IF NOT EXISTS "characters" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" INTEGER,
      "name" TEXT,
      "location" TEXT,
      "x" REAL DEFAULT 0.0,
      "y"	REAL DEFAULT 0.0,
      "z"	REAL DEFAULT 0.0, 
      "rot" REAL DEFAULT 0.0
    );`

    //const defaultUser = `INSERT INTO users ("username","password") VALUES ("test", "test");`  

    this.db.serialize(() => {
      this.db.run(usersSql);
      this.db.run(playersSql);
      //this.db.run(defaultUser);
    });

    Logger.info("Creating default database structure.");

  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          //console.log('sql: ' + sql)
          resolve(result)
        }
      })
    })
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          console.log('sql: ' + sql)
          resolve(rows)
        }
      })
    })
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          console.log('sql: ' + sql)
          resolve({ id: this.lastID })
        }
      })
    })
  }

  ///////////////////////////////////////
  ///////////////////////////////////////
  ///////////////////////////////////////

  async getUser(username, password) {
    const sql = `SELECT * FROM users WHERE username=? AND password=?;` 
    return await this.get(sql, [username, password]);
  }

  async getUserById(user_id) {
    const sql = `SELECT * FROM users WHERE id=?;` 
    return await this.get(sql, [user_id]);
  }

  async getUserByToken(token):Promise<PlayerUser> {
    const sql = `SELECT * FROM users WHERE token=?;` 
    return await this.get(sql, [token]);
  }

  async getCharactersForUser(user_id):Promise<PlayerCharacter[]> {
    const sql = `SELECT * FROM characters WHERE user_id=?;` 
    return await this.all(sql, [user_id]);
  }

  async hasUser(username) {
    const sql = `SELECT * FROM users WHERE username=?;` 
    return await this.get(sql, [username]);
  }

  async refreshToken(user_id) {
    let token = nanoid();
    const sql = `UPDATE users SET token=? WHERE id=?;` 
    await this.run(sql, [token, user_id]);
    console.log("TOKEN REFRESHED", token);
    let user = await this.getUserById(user_id);
    console.log("USER FOUND", user);
    return user;
  }

  async checkToken(token) {
    let sql = `SELECT * FROM users WHERE token=?;` 
    let user:PlayerUser = await this.getUserByToken(token);
    console.log(user);
    user.characters = await this.getCharactersForUser(user.id);
    return user;
  }

  async saveUser(data) {
    const sql = `INSERT INTO users ("username","password") VALUES (
        "${data.username}", 
        "${data.password}", 
      );` 
    return this.db.run(sql);
  }

  ///////////////////////////////////////
  ///////////////////////////////////////
  ///////////////////////////////////////

  async getPlayer(character_id) {
    const sql = `SELECT * FROM characters WHERE id=?;` 
    return await this.get(sql, [character_id]);
  }

  async savePlayer(data) {
    const sql = `INSERT INTO characters ("location","x","y","z","rot") VALUES (
        "${data.location}",
        "${data.x}",
        "${data.y}",
        "${data.z}",
        "${data.rot}"
      );`
    return this.db.run(sql);
  }

  async updatePlayer(character_id:number, data) {
    const sql = `UPDATE characters SET location=?, x=?, y=?, z=?, rot=? WHERE id=? ;` 
    return this.db.run(sql, [
      data.location,
      data.x,
      data.y,
      data.z,
      data.rot,
      character_id
    ]);
  }
}


export default Database