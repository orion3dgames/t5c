"use strict";
/**
 * Copyright (c) 2018 Endel Dreyer
 * Copyright (c) 2014 Ion Drive Software Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchStructureCheck = exports.arrayCheck = exports.numberCheck = exports.number = exports.stringCheck = exports.string = exports.boolean = exports.readFloat64 = exports.readFloat32 = exports.uint64 = exports.int64 = exports.float64 = exports.float32 = exports.uint32 = exports.int32 = exports.uint16 = exports.int16 = exports.uint8 = exports.int8 = void 0;
const spec_1 = require("../spec");
function utf8Read(bytes, offset, length) {
    var string = '', chr = 0;
    for (var i = offset, end = offset + length; i < end; i++) {
        var byte = bytes[i];
        if ((byte & 0x80) === 0x00) {
            string += String.fromCharCode(byte);
            continue;
        }
        if ((byte & 0xe0) === 0xc0) {
            string += String.fromCharCode(((byte & 0x1f) << 6) |
                (bytes[++i] & 0x3f));
            continue;
        }
        if ((byte & 0xf0) === 0xe0) {
            string += String.fromCharCode(((byte & 0x0f) << 12) |
                ((bytes[++i] & 0x3f) << 6) |
                ((bytes[++i] & 0x3f) << 0));
            continue;
        }
        if ((byte & 0xf8) === 0xf0) {
            chr = ((byte & 0x07) << 18) |
                ((bytes[++i] & 0x3f) << 12) |
                ((bytes[++i] & 0x3f) << 6) |
                ((bytes[++i] & 0x3f) << 0);
            if (chr >= 0x010000) { // surrogate pair
                chr -= 0x010000;
                string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
            }
            else {
                string += String.fromCharCode(chr);
            }
            continue;
        }
        console.error('Invalid byte ' + byte.toString(16));
        // (do not throw error to avoid server/client from crashing due to hack attemps)
        // throw new Error('Invalid byte ' + byte.toString(16));
    }
    return string;
}
function int8(bytes, it) {
    return uint8(bytes, it) << 24 >> 24;
}
exports.int8 = int8;
;
function uint8(bytes, it) {
    return bytes[it.offset++];
}
exports.uint8 = uint8;
;
function int16(bytes, it) {
    return uint16(bytes, it) << 16 >> 16;
}
exports.int16 = int16;
;
function uint16(bytes, it) {
    return bytes[it.offset++] | bytes[it.offset++] << 8;
}
exports.uint16 = uint16;
;
function int32(bytes, it) {
    return bytes[it.offset++] | bytes[it.offset++] << 8 | bytes[it.offset++] << 16 | bytes[it.offset++] << 24;
}
exports.int32 = int32;
;
function uint32(bytes, it) {
    return int32(bytes, it) >>> 0;
}
exports.uint32 = uint32;
;
function float32(bytes, it) {
    return readFloat32(bytes, it);
}
exports.float32 = float32;
function float64(bytes, it) {
    return readFloat64(bytes, it);
}
exports.float64 = float64;
function int64(bytes, it) {
    const low = uint32(bytes, it);
    const high = int32(bytes, it) * Math.pow(2, 32);
    return high + low;
}
exports.int64 = int64;
;
function uint64(bytes, it) {
    const low = uint32(bytes, it);
    const high = uint32(bytes, it) * Math.pow(2, 32);
    return high + low;
}
exports.uint64 = uint64;
;
// force little endian to facilitate decoding on multiple implementations
const _isLittleEndian = true; // new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
const _int32 = new Int32Array(2);
const _float32 = new Float32Array(_int32.buffer);
const _float64 = new Float64Array(_int32.buffer);
function readFloat32(bytes, it) {
    _int32[0] = int32(bytes, it);
    return _float32[0];
}
exports.readFloat32 = readFloat32;
;
function readFloat64(bytes, it) {
    _int32[_isLittleEndian ? 0 : 1] = int32(bytes, it);
    _int32[_isLittleEndian ? 1 : 0] = int32(bytes, it);
    return _float64[0];
}
exports.readFloat64 = readFloat64;
;
function boolean(bytes, it) {
    return uint8(bytes, it) > 0;
}
exports.boolean = boolean;
;
function string(bytes, it) {
    const prefix = bytes[it.offset++];
    let length;
    if (prefix < 0xc0) {
        // fixstr
        length = prefix & 0x1f;
    }
    else if (prefix === 0xd9) {
        length = uint8(bytes, it);
    }
    else if (prefix === 0xda) {
        length = uint16(bytes, it);
    }
    else if (prefix === 0xdb) {
        length = uint32(bytes, it);
    }
    const value = utf8Read(bytes, it.offset, length);
    it.offset += length;
    return value;
}
exports.string = string;
function stringCheck(bytes, it) {
    const prefix = bytes[it.offset];
    return (
    // fixstr
    (prefix < 0xc0 && prefix > 0xa0) ||
        // str 8
        prefix === 0xd9 ||
        // str 16
        prefix === 0xda ||
        // str 32
        prefix === 0xdb);
}
exports.stringCheck = stringCheck;
function number(bytes, it) {
    const prefix = bytes[it.offset++];
    if (prefix < 0x80) {
        // positive fixint
        return prefix;
    }
    else if (prefix === 0xca) {
        // float 32
        return readFloat32(bytes, it);
    }
    else if (prefix === 0xcb) {
        // float 64
        return readFloat64(bytes, it);
    }
    else if (prefix === 0xcc) {
        // uint 8
        return uint8(bytes, it);
    }
    else if (prefix === 0xcd) {
        // uint 16
        return uint16(bytes, it);
    }
    else if (prefix === 0xce) {
        // uint 32
        return uint32(bytes, it);
    }
    else if (prefix === 0xcf) {
        // uint 64
        return uint64(bytes, it);
    }
    else if (prefix === 0xd0) {
        // int 8
        return int8(bytes, it);
    }
    else if (prefix === 0xd1) {
        // int 16
        return int16(bytes, it);
    }
    else if (prefix === 0xd2) {
        // int 32
        return int32(bytes, it);
    }
    else if (prefix === 0xd3) {
        // int 64
        return int64(bytes, it);
    }
    else if (prefix > 0xdf) {
        // negative fixint
        return (0xff - prefix + 1) * -1;
    }
}
exports.number = number;
;
function numberCheck(bytes, it) {
    const prefix = bytes[it.offset];
    // positive fixint - 0x00 - 0x7f
    // float 32        - 0xca
    // float 64        - 0xcb
    // uint 8          - 0xcc
    // uint 16         - 0xcd
    // uint 32         - 0xce
    // uint 64         - 0xcf
    // int 8           - 0xd0
    // int 16          - 0xd1
    // int 32          - 0xd2
    // int 64          - 0xd3
    return (prefix < 0x80 ||
        (prefix >= 0xca && prefix <= 0xd3));
}
exports.numberCheck = numberCheck;
function arrayCheck(bytes, it) {
    return bytes[it.offset] < 0xa0;
    // const prefix = bytes[it.offset] ;
    // if (prefix < 0xa0) {
    //   return prefix;
    // // array
    // } else if (prefix === 0xdc) {
    //   it.offset += 2;
    // } else if (0xdd) {
    //   it.offset += 4;
    // }
    // return prefix;
}
exports.arrayCheck = arrayCheck;
function switchStructureCheck(bytes, it) {
    return (
    // previous byte should be `SWITCH_TO_STRUCTURE`
    bytes[it.offset - 1] === spec_1.SWITCH_TO_STRUCTURE &&
        // next byte should be a number
        (bytes[it.offset] < 0x80 || (bytes[it.offset] >= 0xca && bytes[it.offset] <= 0xd3)));
}
exports.switchStructureCheck = switchStructureCheck;
//# sourceMappingURL=decode.js.map