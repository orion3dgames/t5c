const sqlite3 = require('sqlite3');
const dbFilePath = './database.db';
import Logger from "./Logger";
import { nanoid } from 'nanoid';
import { PlayerCharacter, PlayerUser } from "./types";
import { ParsedQs } from "qs";
import Config from "./Config";

class Database {

  private db: typeof sqlite3;

  constructor() {
    this.db = new sqlite3.Database(dbFilePath, (err: any) => {
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

  get(sql: string, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: any, result: unknown) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          //console.log('sql: ' + sql, params, result)
          resolve(result)
        }
      })
    })
  }

  all(sql: string, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: any, rows: unknown) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          //console.log('sql: ' + sql)
          resolve(rows)
        }
      })
    })
  }

  run(sql: string, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err: any) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          //console.log('sql: ' + sql)
          resolve({ id: this.lastID })
        }
      })
    })
  }

  ///////////////////////////////////////
  ///////////////////////////////////////
  ///////////////////////////////////////

  async getUser(username: string | string[] | ParsedQs | ParsedQs[], password: string | string[] | ParsedQs | ParsedQs[]) {
    const sql = `SELECT * FROM users WHERE username=? AND password=?;` 
    return await this.get(sql, [username, password]);
  }

  async getUserById(user_id: number):Promise<PlayerUser> {
    const sql = `SELECT * FROM users WHERE id=?;` 
    let user = await <any> this.get(sql, [user_id]);
    user.characters = await this.getCharactersForUser(user.id);
    return user;
  }

  async getUserByToken(token: any):Promise<PlayerUser> { 
    const sql = `SELECT * FROM users WHERE token=?;` 
    return <PlayerUser> await this.get(sql, [token]);
  }

  async getCharactersForUser(user_id: number):Promise<PlayerCharacter[]> {
    const sql = `SELECT * FROM characters WHERE user_id=?;` 
    return <PlayerCharacter[]> await this.all(sql, [user_id]);
  }
   
  async hasUser(username:string) {
    const sql = `SELECT * FROM users WHERE username=?;` 
    return await this.get(sql, [username]);
  }

  async refreshToken(user_id:number) {
    let token = nanoid();
    const sql = `UPDATE users SET token=? WHERE id=?;` 
    await this.run(sql, [token, user_id]);
    let user = await this.getUserById(user_id);
    return user;
  } 

  async checkToken(token: string):Promise<PlayerUser> {
    let user = await this.getUserByToken(token);
    user.characters = await this.getCharactersForUser(user.id);
    return user;
  }

  async saveUser(username: string, password: string, token:string = nanoid()) {
    const sql = `INSERT INTO users ("username","password", "token") VALUES (
        "${username}", 
        "${password}", 
        "${token}" 
      );`;
    let c = await <any> this.run(sql);
    return await this.getUserById(c.id);
  }

  ///////////////////////////////////////
  ///////////////////////////////////////
  ///////////////////////////////////////

  async getCharacter(id: number){
    const sql = `SELECT * FROM characters WHERE id=?;` 
    return await this.get(sql, [id]);
  }

  async createCharacter(token, name) {
    let user = await this.getUserByToken(token);
    let defaultLocation = Config.locations[Config.initialLocation];
    const sql = `INSERT INTO characters ("user_id", "name","location","x","y","z","rot") VALUES (
        "${user.id}",
        "${name}",
        "${defaultLocation.key}",
        "${defaultLocation.spawnPoint.x}",
        "${defaultLocation.spawnPoint.y}",
        "${defaultLocation.spawnPoint.z}",
        "0"
      );`
    let c = await <any> this.run(sql);
    return await this.getCharacter(c.id);
  }

  async updateCharacter(character_id:number, data: { location: any; x: any; y: any; z: any; rot: any; }) {
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