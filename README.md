# T5C - The 5th Continent
Building a basic multiplayer 3d top down rpg using babylon.js and colyseus

## Current progress:
- vat animations and instances
- fully player authorative movement with client side prediction and server reconciliation
  - diablo like movement using the mouse with the ability to click to move
- scene management (login, register, character selection, etc...)
- map management (ability to teleport to a different map (ex: a dungeon) )
- multiplayer animated characters
- global chat (works accross zones)
- uses a navmesh for collision detection
- player data can be saved with mysql lite / mysql
- basic enemies with simple AI behaviour (IDLE, PATROL, CHASE, ATTACK, DEAD)
- enemies can drop items (based on a loot table)
- 4 basic abilities ( sword attack, fireball, dot, heal )
- ability to target players and enemies
- ability to pick up items and see them in your inventory
- ability to equip items and see them on your character
- basic player levelling with experience and ability points
- fully functional UI (experience bar, abilities bar, draggable panels, etc...)
- simple quest system
- simple trainer system (learn abilities)
- simple vendor system (buy and sell)

## Links
Follow the progress on the official babylon.js forum: [https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733](https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733)

Check out my devlogs on [https://dev.to/orion3d](https://dev.to/orion3d)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `npm install`

## Technology
- Babylon.js 6.x.x [https://www.babylonjs.com/](https://www.babylonjs.com/)
- Colyseus 0.15.x [https://colyseus.io/](https://colyseus.io/)
- SQLite 3.x.x [https://www.sqlite.org/](https://www.sqlite.org/)
  - Optionally, you can use MYSQL instead by updating the setting in src/shared/Config.ts

## How to run
- Run `npm run server-dev` to launch the server
- Run `npm run client-dev` to launch the client

> The client should be accessible at [`http://localhost:8080`](http://localhost:8080)

> The server should be available locally at [http://localhost:3000](http://localhost:3000)

> The Colyseus monitor should be available at [[http://localhost:3000/monitor](http://localhost:3000/monitor)

## Load testing
- Run `npx tsx ./loadtest/test.ts --room game_room --numClients 1 --endpoint ws://localhost:3000`
