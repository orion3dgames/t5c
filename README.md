# T5C

## Current progress:
- fully authorative movement with client side prediction and server reconciliation (server is king)
- Simple scene management & switching
- animated characters (multiplayer works too)
- zoning system (ability to teleport to different locations)

## Reference
- [See step-by-step Tutorial](https://doc.babylonjs.com/guidedLearning/multiplayer/Colyseus)
- [See server-side Project](https://github.com/colyseus/tutorial-babylonjs-server)
- [See Colyseus documentation](https://docs.colyseus.io/)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `npm install`

## How to run client
- Run `npm run both-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:2567`, and [http://localhost:2567](http://localhost:2567) should be accessible.

## License

MIT
