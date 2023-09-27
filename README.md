# T5C - The 5th Continent
Building a basic multiplayer 3d top down rpg using babylon.js and colyseus

## Current progress:
- can support up to 20 people per map (depends on server of course)
- fully player authorative movement with client side prediction and server reconciliation
  - diablo like movement using the mouse with the ability to click to move
- scene management (login, register, character selection, etc...)
- map management (ability to teleport to a different map (ex: a dungeon) )
- multiplayer animated characters
- global chat (works accross zones)
- uses a navmesh for collision detection
- persistence with mysql lite
- basic enemies with simple AI behaviour (IDLE, PATROL, CHASE, ATTACK, DEAD)
- enemies can drop items (based on a loot table)
- 4 abilities ( basic attack, fireball, dot, heal )
- ability to target players and enemies
- ability to pick up items and see them in your inventory
- ability to equip items and see them on your character
- basic player levelling with experience and ability points
- fully functional UI (experience bar, abilities bar, draggable panels, etc...)
- and more... 

## Roadmap
You can follow the progress here: [FORUM POST](https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `yarn install`

## Technology
- Babylon.js 6.x.x (3d rendering engine)
- Colyseus 0.15.x (networking)
- SQLite (database)

## How to run client
- Run `yarn client-dev`

## How to run server
- Run `yarn server-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:3000`, and [http://localhost:3000](http://localhost:3000) should be accessible.

## Load testing
- Run `npx tsx ./loadtest/test.ts --room game_room --numClients 1 --endpoint ws://localhost:3000`
