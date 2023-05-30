# T5C
Building a basic multiplayer 3d top down rpg using babylon.js and colyseus

## Current progress:
- fully authorative movement with client side prediction and server reconciliation (server is king)
- Simple scene management & switching
- animated characters (multiplayer works too)
- zoning system (ability to teleport to different locations)
- global chat (works accross zones)
- server controlled collisions
- persistence with mysql lite
- 4 abilities ( basic attack, fireball, dot, heal )
- roaming monsters (with basic ai & attacks)
- selecting characters and monsters
- monsters have a loottable and can drop items
- ability to pick up items 
- standard UI (experience bar, abilities bar, panels, etc...)
- and more...

## Roadmap
You can follow the progress here: [FORUM POST](https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `yarn install`

## Technology
- Babylon.js 6 (3d rendering engine)
- Colyseus 0.15 (networking)
- SQLite (database)

## How to run client
- Run `yarn client-dev`

## How to run server
- Run `yarn server-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:3000`, and [http://localhost:3000](http://localhost:3000) should be accessible.

## Load testing
- Run `npx tsx ./loadtest/test.ts --room game_room --numClients 1 --endpoint ws://localhost:3000`

## License
Everything under ./src is licensed under the GNU license except for the yuka library who is MIT license.
All models under the ./public/models folder does not fall under the GNU license and cannot be used commercially.
