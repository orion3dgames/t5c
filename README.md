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
- abilities
- roadming monsters (with basic ai & attacks)
- selecting characters and monsters
- and more...

## Roadmap
You can follow the progress here: [FORUM POST](https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `yarn install`

## Technology
- Babylon.js (3d rendering engine)
- Colyseus (networking)
- SQLite (database)

## How to run client
- Run `yarn client-dev`

## How to run server
- Run `yarn server-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:3000`, and [http://localhost:3000](http://localhost:3000) should be accessible.

## License
Everything under ./src is licensed under the GNU license except for the yuka library who is MIT license.
All models under the ./public/models folder does not fall under the GNU license and cannot be used commercially.
