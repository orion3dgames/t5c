# T5C
Building a basic multiplayer top down rpg using babylong.js and colyseus

## Current progress:
- fully authorative movement with client side prediction and server reconciliation (server is king)
- Simple scene management & switching
- animated characters (multiplayer works too)
- zoning system (ability to teleport to different locations)
- global chat

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `yarn install`

## How to run client
- Run `yarn client-dev`

## How to run server
- Run `yarn server-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:2567`, and [http://localhost:2567](http://localhost:2567) should be accessible.
