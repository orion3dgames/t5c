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
/**
 * msgpack implementation highly based on notepack.io
 * https://github.com/darrachequesne/notepack
 */
export interface Iterator {
    offset: number;
}
export declare function int8(bytes: number[], it: Iterator): number;
export declare function uint8(bytes: number[], it: Iterator): number;
export declare function int16(bytes: number[], it: Iterator): number;
export declare function uint16(bytes: number[], it: Iterator): number;
export declare function int32(bytes: number[], it: Iterator): number;
export declare function uint32(bytes: number[], it: Iterator): number;
export declare function float32(bytes: number[], it: Iterator): number;
export declare function float64(bytes: number[], it: Iterator): number;
export declare function int64(bytes: number[], it: Iterator): number;
export declare function uint64(bytes: number[], it: Iterator): number;
export declare function readFloat32(bytes: number[], it: Iterator): number;
export declare function readFloat64(bytes: number[], it: Iterator): number;
export declare function boolean(bytes: number[], it: Iterator): boolean;
export declare function string(bytes: any, it: Iterator): string;
export declare function stringCheck(bytes: any, it: Iterator): boolean;
export declare function number(bytes: any, it: Iterator): any;
export declare function numberCheck(bytes: any, it: Iterator): boolean;
export declare function arrayCheck(bytes: any, it: Iterator): boolean;
export declare function switchStructureCheck(bytes: any, it: Iterator): boolean;
