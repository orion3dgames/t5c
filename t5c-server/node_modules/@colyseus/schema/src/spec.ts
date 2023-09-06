// export const SWITCH_TO_STRUCTURE = 193; (easily collides with DELETE_AND_ADD + fieldIndex = 2)
export const SWITCH_TO_STRUCTURE = 255; // (decoding collides with DELETE_AND_ADD + fieldIndex = 63)
export const TYPE_ID = 213;

/**
 * Encoding Schema field operations.
 */
export enum OPERATION {
    // add new structure/primitive
    ADD = 128,

    // replace structure/primitive
    REPLACE = 0,

    // delete field
    DELETE = 64,

    // DELETE field, followed by an ADD
    DELETE_AND_ADD = 192, // 11100000

    // TOUCH is used to determine hierarchy of nested Schema structures during serialization.
    // touches are NOT encoded.
    TOUCH = 1, // 00000000

    // MapSchema Operations
    CLEAR = 10,
}

// export enum OPERATION {
//     // add new structure/primitive
//     // (128)
//     ADD = 128, // 10000000,

//     // replace structure/primitive
//     REPLACE = 1,// 00000001

//     // delete field
//     DELETE = 192, // 11000000

//     // DELETE field, followed by an ADD
//     DELETE_AND_ADD = 224, // 11100000

//     // TOUCH is used to determine hierarchy of nested Schema structures during serialization.
//     // touches are NOT encoded.
//     TOUCH = 0, // 00000000

//     // MapSchema Operations
//     CLEAR = 10,
// }