CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT, 
    "token" TEXT
);
        
CREATE TABLE IF NOT EXISTS "characters" (
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
);

CREATE TABLE IF NOT EXISTS "character_inventory" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER,
    "order" INTEGER,
    "qty" INTEGER,
    "key" TEXT
);

CREATE TABLE IF NOT EXISTS "character_hotbar" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER,
    "type" TEXT,
    "key" TEXT,
    "digit" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "character_abilities" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER,
    "key" TEXT
); 

CREATE TABLE IF NOT EXISTS "character_equipment" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER,
    "slot" INTEGER,
    "key" TEXT
);

CREATE TABLE IF NOT EXISTS "character_quests" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER,
    "key" TEXT,
    "status" INTEGER DEFAULT 0,
    "qty" INTEGER DEFAULT 0,
    UNIQUE("id")
);