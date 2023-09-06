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

import { SWITCH_TO_STRUCTURE } from "../spec";

/**
 * msgpack implementation highly based on notepack.io
 * https://github.com/darrachequesne/notepack
 */

export interface Iterator { offset: number; }

function utf8Read(bytes, offset, length) {
  var string = '', chr = 0;
  for (var i = offset, end = offset + length; i < end; i++) {
    var byte = bytes[i];
    if ((byte & 0x80) === 0x00) {
      string += String.fromCharCode(byte);
      continue;
    }
    if ((byte & 0xe0) === 0xc0) {
      string += String.fromCharCode(
        ((byte & 0x1f) << 6) |
        (bytes[++i] & 0x3f)
      );
      continue;
    }
    if ((byte & 0xf0) === 0xe0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 12) |
        ((bytes[++i] & 0x3f) << 6) |
        ((bytes[++i] & 0x3f) << 0)
      );
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
      } else {
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

export function int8 (bytes: number[], it: Iterator) {
    return uint8(bytes, it) << 24 >> 24;
};

export function uint8 (bytes: number[], it: Iterator) {
    return bytes[it.offset++];
};

export function int16 (bytes: number[], it: Iterator) {
    return uint16(bytes, it) << 16 >> 16;
};

export function uint16 (bytes: number[], it: Iterator) {
    return bytes[it.offset++] | bytes[it.offset++] << 8;
};

export function int32 (bytes: number[], it: Iterator) {
    return bytes[it.offset++] | bytes[it.offset++] << 8 | bytes[it.offset++] << 16 | bytes[it.offset++] << 24;
};

export function uint32 (bytes: number[], it: Iterator) {
    return int32(bytes, it) >>> 0;
};

export function float32(bytes: number[], it: Iterator) {
  return readFloat32(bytes, it);
}

export function float64(bytes: number[], it: Iterator) {
  return readFloat64(bytes, it);
}

export function int64(bytes: number[], it: Iterator) {
  const low = uint32(bytes, it);
  const high = int32(bytes, it) * Math.pow(2, 32);
  return high + low;
};

export function uint64(bytes: number[], it: Iterator) {
  const low = uint32(bytes, it);
  const high = uint32(bytes, it) * Math.pow(2, 32);
  return high + low;
};

// force little endian to facilitate decoding on multiple implementations
const _isLittleEndian = true;  // new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
const _int32 = new Int32Array(2);
const _float32 = new Float32Array(_int32.buffer);
const _float64 = new Float64Array(_int32.buffer);

export function readFloat32 (bytes: number[], it: Iterator) {
    _int32[0] = int32(bytes, it);
    return _float32[0];
};

export function readFloat64 (bytes: number[], it: Iterator) {
    _int32[_isLittleEndian ? 0 : 1] = int32(bytes, it);
    _int32[_isLittleEndian ? 1 : 0] = int32(bytes, it);
    return _float64[0];
};

export function boolean (bytes: number[], it: Iterator) {
    return uint8(bytes, it) > 0;
};

export function string (bytes, it: Iterator) {
  const prefix = bytes[it.offset++];
  let length: number;

  if (prefix < 0xc0) {
    // fixstr
    length = prefix & 0x1f;

  } else if (prefix === 0xd9) {
    length = uint8(bytes, it);

  } else if (prefix === 0xda) {
    length = uint16(bytes, it);

  } else if (prefix === 0xdb) {
    length = uint32(bytes, it);
  }

  const value = utf8Read(bytes, it.offset, length);
  it.offset += length;

  return value;
}

export function stringCheck(bytes, it: Iterator) {
  const prefix = bytes[it.offset];
  return (
    // fixstr
    (prefix < 0xc0 && prefix > 0xa0) ||
    // str 8
    prefix === 0xd9 ||
    // str 16
    prefix === 0xda ||
    // str 32
    prefix === 0xdb
  );
}

export function number (bytes, it: Iterator) {
  const prefix = bytes[it.offset++];

  if (prefix < 0x80) {
    // positive fixint
    return prefix;

  } else if (prefix === 0xca) {
    // float 32
    return readFloat32(bytes, it);

  } else if (prefix === 0xcb) {
    // float 64
    return readFloat64(bytes, it);

  } else if (prefix === 0xcc) {
    // uint 8
    return uint8(bytes, it);

  } else if (prefix === 0xcd) {
    // uint 16
    return uint16(bytes, it);

  } else if (prefix === 0xce) {
    // uint 32
    return uint32(bytes, it);

  } else if (prefix === 0xcf) {
    // uint 64
    return uint64(bytes, it);

  } else if (prefix === 0xd0) {
    // int 8
    return int8(bytes, it);

  } else if (prefix === 0xd1) {
    // int 16
    return int16(bytes, it);

  } else if (prefix === 0xd2) {
    // int 32
    return int32(bytes, it);

  } else if (prefix === 0xd3) {
    // int 64
    return int64(bytes, it);

  } else if (prefix > 0xdf) {
    // negative fixint
    return (0xff - prefix + 1) * -1
  }
};

export function numberCheck (bytes, it: Iterator) {
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
  return (
    prefix < 0x80 ||
    (prefix >= 0xca && prefix <= 0xd3)
  );
}

export function arrayCheck (bytes, it: Iterator) {
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

export function switchStructureCheck(bytes, it: Iterator) {
  return (
      // previous byte should be `SWITCH_TO_STRUCTURE`
      bytes[it.offset - 1] === SWITCH_TO_STRUCTURE &&
      // next byte should be a number
      (bytes[it.offset] < 0x80 || (bytes[it.offset] >= 0xca && bytes[it.offset] <= 0xd3))
  );
}