import './legacy';
export { Client, JoinOptions } from './Client';
export { Protocol, ErrorCode } from './Protocol';
export { Room, RoomAvailable } from './Room';
export { Auth, Platform, Device } from "./Auth";
import { SchemaSerializer } from "./serializer/SchemaSerializer";
import { registerSerializer } from './serializer/Serializer';
export { registerSerializer, SchemaSerializer };
