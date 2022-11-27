const sqlite3 = require('sqlite3');
const dbFilePath = './database.db';

class databaseInstance {

  private db: typeof sqlite3;

  constructor() {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.log('Could not connect to database', err)
      } else {
        console.log('Connected to database')
      }
    });

    // initialize all tables
    this.create();

  }

  create() {

    const playersSql = `CREATE TABLE IF NOT EXISTS "players" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "username" TEXT,
      "password" TEXT,
      "location" TEXT,
      "x" NUMERIC DEFAULT 0.0,
      "y"	NUMERIC DEFAULT 0.0,
      "z"	NUMERIC DEFAULT 0.0,
      "rot" NUMERIC DEFAULT 0.0,
      "token" TEXT
    );` 

    this.db.serialize(() => {
      this.db.run(playersSql);
    });

  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          console.log('sql: ' + sql)
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

  async getPlayer(username) {
    const sql = `SELECT * FROM players WHERE username=?;` 
    return await this.get(sql, [username]);
  }

  async savePlayer(data) {
    const sql = `INSERT INTO players (
      "username","password","location","x","y","z","rot") VALUES 
      (
        "${data.username}", 
        "test",
        "${data.location}",
        "${data.x}",
        "${data.y}",
        "${data.z}",
        "${data.rot}"
      );` 
      console.log(sql);
    return this.db.run(sql);
  }

  async updatePlayer(player_id:number, data) {
    const sql = `UPDATE players SET location=?, x=?, y=?, z=?, rot=? WHERE id=? ;` 
    return this.db.run(sql, [
      data.location,
      data.x,
      data.y,
      data.z,
      data.rot,
      player_id
    ]);
  }
}


export default databaseInstance