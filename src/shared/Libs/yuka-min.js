const BINARY_EXTENSION_HEADER_MAGIC = "glTF";
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };

const WEBGL_TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

const WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

/**
 * Class representing a 3D vector.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class Vector3 {
    /**
     * Constructs a new 3D vector with the given values.
     *
     * @param {Number} x - The x component.
     * @param {Number} y - The y component.
     * @param {Number} z - The z component.
     */
    constructor(x = 0, y = 0, z = 0) {
        /**
         * The x component.
         * @type {Number}
         */
        this.x = x;

        /**
         * The y component.
         * @type {Number}
         */
        this.y = y;

        /**
         * The z component.
         * @type {Number}
         */
        this.z = z;
    }

    /**
     * Sets the given values to this 3D vector.
     *
     * @param {Number} x - The x component.
     * @param {Number} y - The y component.
     * @param {Number} z - The z component.
     * @return {Vector3} A reference to this vector.
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    /**
     * Copies all values from the given 3D vector to this 3D vector.
     *
     * @param {Vector3} v - The vector to copy.
     * @return {Vector3} A reference to this vector.
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;
    }

    /**
     * Creates a new 3D vector and copies all values from this 3D vector.
     *
     * @return {Vector3} A new 3D vector.
     */
    clone() {
        return new this.constructor().copy(this);
    }

    /**
     * Adds the given 3D vector to this 3D vector.
     *
     * @param {Vector3} v - The vector to add.
     * @return {Vector3} A reference to this vector.
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;
    }

    /**
     * Adds the given scalar to this 3D vector.
     *
     * @param {Number} s - The scalar to add.
     * @return {Vector3} A reference to this vector.
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;

        return this;
    }

    /**
     * Adds two given 3D vectors and stores the result in this 3D vector.
     *
     * @param {Vector3} a - The first vector of the operation.
     * @param {Vector3} b - The second vector of the operation.
     * @return {Vector3} A reference to this vector.
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;

        return this;
    }

    /**
     * Subtracts the given 3D vector from this 3D vector.
     *
     * @param {Vector3} v - The vector to substract.
     * @return {Vector3} A reference to this vector.
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;
    }

    /**
     * Subtracts the given scalar from this 3D vector.
     *
     * @param {Number} s - The scalar to substract.
     * @return {Vector3} A reference to this vector.
     */
    subScalar(s) {
        this.x -= s;
        this.y -= s;
        this.z -= s;

        return this;
    }

    /**
     * Subtracts two given 3D vectors and stores the result in this 3D vector.
     *
     * @param {Vector3} a - The first vector of the operation.
     * @param {Vector3} b - The second vector of the operation.
     * @return {Vector3} A reference to this vector.
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;

        return this;
    }

    /**
     * Multiplies the given 3D vector with this 3D vector.
     *
     * @param {Vector3} v - The vector to multiply.
     * @return {Vector3} A reference to this vector.
     */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;

        return this;
    }

    /**
     * Multiplies the given scalar with this 3D vector.
     *
     * @param {Number} s - The scalar to multiply.
     * @return {Vector3} A reference to this vector.
     */
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;

        return this;
    }

    /**
     * Multiplies two given 3D vectors and stores the result in this 3D vector.
     *
     * @param {Vector3} a - The first vector of the operation.
     * @param {Vector3} b - The second vector of the operation.
     * @return {Vector3} A reference to this vector.
     */
    multiplyVectors(a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;

        return this;
    }

    /**
     * Divides the given 3D vector through this 3D vector.
     *
     * @param {Vector3} v - The vector to divide.
     * @return {Vector3} A reference to this vector.
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;

        return this;
    }

    /**
     * Divides the given scalar through this 3D vector.
     *
     * @param {Number} s - The scalar to multiply.
     * @return {Vector3} A reference to this vector.
     */
    divideScalar(s) {
        this.x /= s;
        this.y /= s;
        this.z /= s;

        return this;
    }

    /**
     * Divides two given 3D vectors and stores the result in this 3D vector.
     *
     * @param {Vector3} a - The first vector of the operation.
     * @param {Vector3} b - The second vector of the operation.
     * @return {Vector3} A reference to this vector.
     */
    divideVectors(a, b) {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        this.z = a.z / b.z;

        return this;
    }

    /**
     * Reflects this vector along the given normal.
     *
     * @param {Vector3} normal - The normal vector.
     * @return {Vector3} A reference to this vector.
     */
    reflect(normal) {
        // solve r = v - 2( v * n ) * n

        return this.sub(v1$4.copy(normal).multiplyScalar(2 * this.dot(normal)));
    }

    /**
     * Ensures this 3D vector lies in the given min/max range.
     *
     * @param {Vector3} min - The min range.
     * @param {Vector3} max - The max range.
     * @return {Vector3} A reference to this vector.
     */
    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));

        return this;
    }

    /**
     * Compares each vector component of this 3D vector and the
     * given one and stores the minimum value in this instance.
     *
     * @param {Vector3} v - The 3D vector to check.
     * @return {Vector3} A reference to this vector.
     */
    min(v) {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        this.z = Math.min(this.z, v.z);

        return this;
    }

    /**
     * Compares each vector component of this 3D vector and the
     * given one and stores the maximum value in this instance.
     *
     * @param {Vector3} v - The 3D vector to check.
     * @return {Vector3} A reference to this vector.
     */
    max(v) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        this.z = Math.max(this.z, v.z);

        return this;
    }

    /**
     * Computes the dot product of this and the given 3D vector.
     *
     * @param {Vector3} v - The given 3D vector.
     * @return {Number} The results of the dor product.
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    /**
     * Computes the cross product of this and the given 3D vector and
     * stores the result in this 3D vector.
     *
     * @param {Vector3} v - A 3D vector.
     * @return {Vector3} A reference to this vector.
     */
    cross(v) {
        const x = this.x,
            y = this.y,
            z = this.z;

        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;

        return this;
    }

    /**
     * Computes the cross product of the two given 3D vectors and
     * stores the result in this 3D vector.
     *
     * @param {Vector3} a - The first 3D vector.
     * @param {Vector3} b - The second 3D vector.
     * @return {Vector3} A reference to this vector.
     */
    crossVectors(a, b) {
        const ax = a.x,
            ay = a.y,
            az = a.z;
        const bx = b.x,
            by = b.y,
            bz = b.z;

        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;

        return this;
    }

    /**
     * Computes the angle between this and the given vector.
     *
     * @param {Vector3} v - A 3D vector.
     * @return {Number} The angle in radians.
     */
    angleTo(v) {
        const denominator = Math.sqrt(this.squaredLength() * v.squaredLength());

        if (denominator === 0) return 0;

        const theta = this.dot(v) / denominator;

        // clamp, to handle numerical problems

        return Math.acos(MathUtils.clamp(theta, -1, 1));
    }

    /**
     * Computes the length of this 3D vector.
     *
     * @return {Number} The length of this 3D vector.
     */
    length() {
        return Math.sqrt(this.squaredLength());
    }

    /**
     * Computes the squared length of this 3D vector.
     * Calling this method is faster than calling {@link Vector3#length},
     * since it avoids computing a square root.
     *
     * @return {Number} The squared length of this 3D vector.
     */
    squaredLength() {
        return this.dot(this);
    }

    /**
     * Computes the manhattan length of this 3D vector.
     *
     * @return {Number} The manhattan length of this 3D vector.
     */
    manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }

    /**
     * Computes the euclidean distance between this 3D vector and the given one.
     *
     * @param {Vector3} v - A 3D vector.
     * @return {Number} The euclidean distance between two 3D vectors.
     */
    distanceTo(v) {
        return Math.sqrt(this.squaredDistanceTo(v));
    }

    /**
     * Computes the squared euclidean distance between this 3D vector and the given one.
     * Calling this method is faster than calling {@link Vector3#distanceTo},
     * since it avoids computing a square root.
     *
     * @param {Vector3} v - A 3D vector.
     * @return {Number} The squared euclidean distance between two 3D vectors.
     */
    squaredDistanceTo(v) {
        const dx = this.x - v.x,
            dy = this.y - v.y,
            dz = this.z - v.z;

        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Computes the manhattan distance between this 3D vector and the given one.
     *
     * @param {Vector3} v - A 3D vector.
     * @return {Number} The manhattan distance between two 3D vectors.
     */
    manhattanDistanceTo(v) {
        const dx = this.x - v.x,
            dy = this.y - v.y,
            dz = this.z - v.z;

        return Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
    }

    /**
     * Normalizes this 3D vector.
     *
     * @return {Vector3} A reference to this vector.
     */
    normalize() {
        return this.divideScalar(this.length() || 1);
    }

    /**
     * Multiplies the given 4x4 matrix with this 3D vector
     *
     * @param {Matrix4} m - A 4x4 matrix.
     * @return {Vector3} A reference to this vector.
     */
    applyMatrix4(m) {
        const x = this.x,
            y = this.y,
            z = this.z;
        const e = m.elements;

        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;
    }

    /**
     * Multiplies the given quaternion with this 3D vector.
     *
     * @param {Quaternion} q - A quaternion.
     * @return {Vector3} A reference to this vector.
     */
    applyRotation(q) {
        const x = this.x,
            y = this.y,
            z = this.z;
        const qx = q.x,
            qy = q.y,
            qz = q.z,
            qw = q.w;

        // calculate quat * vector

        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;
    }

    /**
     * Extracts the position portion of the given 4x4 matrix and stores it in this 3D vector.
     *
     * @param {Matrix4} m - A 4x4 matrix.
     * @return {Vector3} A reference to this vector.
     */
    extractPositionFromMatrix(m) {
        const e = m.elements;

        this.x = e[12];
        this.y = e[13];
        this.z = e[14];

        return this;
    }

    /**
     * Transform this direction vector by the given 4x4 matrix.
     *
     * @param {Matrix4} m - A 4x4 matrix.
     * @return {Vector3} A reference to this vector.
     */
    transformDirection(m) {
        const x = this.x,
            y = this.y,
            z = this.z;
        const e = m.elements;

        this.x = e[0] * x + e[4] * y + e[8] * z;
        this.y = e[1] * x + e[5] * y + e[9] * z;
        this.z = e[2] * x + e[6] * y + e[10] * z;

        return this.normalize();
    }

    /**
     * Sets the components of this 3D vector from a column of a 3x3 matrix.
     *
     * @param {Matrix3} m - A 3x3 matrix.
     * @param {Number} i - The index of the column.
     * @return {Vector3} A reference to this vector.
     */
    fromMatrix3Column(m, i) {
        return this.fromArray(m.elements, i * 3);
    }

    /**
     * Sets the components of this 3D vector from a column of a 4x4 matrix.
     *
     * @param {Matrix3} m - A 4x4 matrix.
     * @param {Number} i - The index of the column.
     * @return {Vector3} A reference to this vector.
     */
    fromMatrix4Column(m, i) {
        return this.fromArray(m.elements, i * 4);
    }

    /**
     * Sets the components of this 3D vector from a spherical coordinate.
     *
     * @param {Number} radius - The radius.
     * @param {Number} phi - The polar or inclination angle in radians. Should be in the range of (−π/2, +π/2].
     * @param {Number} theta - The azimuthal angle in radians. Should be in the range of (−π, +π].
     * @return {Vector3} A reference to this vector.
     */
    fromSpherical(radius, phi, theta) {
        const sinPhiRadius = Math.sin(phi) * radius;

        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);

        return this;
    }

    /**
     * Sets the components of this 3D vector from an array.
     *
     * @param {Array<Number>} array - An array.
     * @param {Number} offset - An optional offset.
     * @return {Vector3} A reference to this vector.
     */
    fromArray(array, offset = 0) {
        this.x = array[offset + 0];
        this.y = array[offset + 1];
        this.z = array[offset + 2];

        return this;
    }

    /**
     * Copies all values of this 3D vector to the given array.
     *
     * @param {Array<Number>} array - An array.
     * @param {Number} offset - An optional offset.
     * @return {Array<Number>} The array with the 3D vector components.
     */
    toArray(array, offset = 0) {
        array[offset + 0] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;

        return array;
    }

    /**
     * Returns true if the given 3D vector is deep equal with this 3D vector.
     *
     * @param {Vector3} v - The 3D vector to test.
     * @return {Boolean} The result of the equality test.
     */
    equals(v) {
        return v.x === this.x && v.y === this.y && v.z === this.z;
    }

    /////
    /////
    /////
    /////
    /////
    subtractToRef(other, result) {
        const m = this._m,
            otherM = other.m,
            resultM = result._m;
        for (let i = 0; i < 16; i++) {
            resultM[i] = m[i] - otherM[i];
        }
        return result;
    }

    /**
     * Gets the rotation that aligns the roll axis (Y) to the line joining the start point to the target point and stores it in the ref Vector3
     * Example PG https://playground.babylonjs.com/#R1F8YU#189
     * @param start the starting point
     * @param target the target point
     * @param ref the vector3 to store the result
     * @returns ref in the form (pitch, yaw, 0)
     */
    static PitchYawRollToMoveBetweenPointsToRef(start, target, ref) {
        const diff = TmpVectors.Vector3[0];
        target.subtractToRef(start, diff);
        ref.y = Math.atan2(diff.x, diff.z) || 0;
        ref.x = Math.atan2(Math.sqrt(diff.x ** 2 + diff.z ** 2), diff.y) || 0;
        ref.z = 0;
        return ref;
    }

    /**
     * Gets the rotation that aligns the roll axis (Y) to the line joining the start point to the target point
     * Example PG https://playground.babylonjs.com/#R1F8YU#188
     * @param start the starting point
     * @param target the target point
     * @returns the rotation in the form (pitch, yaw, 0)
     */
    static PitchYawRollToMoveBetweenPoints(start, target) {
        const ref = Vector3(0, 0, 0);
        return Vector3.PitchYawRollToMoveBetweenPointsToRef(start, target, ref);
    }
}

const v1$2 = new Vector3();
const v2$1 = new Vector3();
const d$1 = new Vector3();

/**
 * Class with various math helpers.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class MathUtils {
    /**
     * Computes the signed area of a rectangle defined by three points.
     * This method can also be used to calculate the area of a triangle.
     *
     * @param {Vector3} a - The first point in 3D space.
     * @param {Vector3} b - The second point in 3D space.
     * @param {Vector3} c - The third point in 3D space.
     * @return {Number} The signed area.
     */
    static area(a, b, c) {
        return (c.x - a.x) * (b.z - a.z) - (b.x - a.x) * (c.z - a.z);
    }

    /**
     * Returns the indices of the maximum values of the given array.
     *
     * @param {Array<Number>} array - The input array.
     * @return {Array<Number>} Array of indices into the array.
     */
    static argmax(array) {
        const max = Math.max(...array);
        const indices = [];

        for (let i = 0, l = array.length; i < l; i++) {
            if (array[i] === max) indices.push(i);
        }

        return indices;
    }

    /**
     * Returns a random sample from a given array.
     *
     * @param {Array<Any>} array - The array that is used to generate the random sample.
     * @param {Array<Number>} probabilities - The probabilities associated with each entry. If not given, the sample assumes a uniform distribution over all entries.
     * @return {Any} The random sample value.
     */
    static choice(array, probabilities = null) {
        const random = Math.random();

        if (probabilities === null) {
            return array[Math.floor(Math.random() * array.length)];
        } else {
            let probability = 0;

            const index = array
                .map((value, index) => {
                    probability += probabilities[index];

                    return probability;
                })
                .findIndex((probability) => probability >= random);

            return array[index];
        }
    }

    /**
     * Ensures the given scalar value is within a given min/max range.
     *
     * @param {Number} value - The value to clamp.
     * @param {Number} min - The min value.
     * @param {Number} max - The max value.
     * @return {Number} The clamped value.
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Computes a RFC4122 Version 4 complied Universally Unique Identifier (UUID).
     *
     * @return {String} The UUID.
     */
    static generateUUID() {
        // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/21963136#21963136

        const d0 = (Math.random() * 0xffffffff) | 0;
        const d1 = (Math.random() * 0xffffffff) | 0;
        const d2 = (Math.random() * 0xffffffff) | 0;
        const d3 = (Math.random() * 0xffffffff) | 0;
        const uuid =
            lut[d0 & 0xff] +
            lut[(d0 >> 8) & 0xff] +
            lut[(d0 >> 16) & 0xff] +
            lut[(d0 >> 24) & 0xff] +
            "-" +
            lut[d1 & 0xff] +
            lut[(d1 >> 8) & 0xff] +
            "-" +
            lut[((d1 >> 16) & 0x0f) | 0x40] +
            lut[(d1 >> 24) & 0xff] +
            "-" +
            lut[(d2 & 0x3f) | 0x80] +
            lut[(d2 >> 8) & 0xff] +
            "-" +
            lut[(d2 >> 16) & 0xff] +
            lut[(d2 >> 24) & 0xff] +
            lut[d3 & 0xff] +
            lut[(d3 >> 8) & 0xff] +
            lut[(d3 >> 16) & 0xff] +
            lut[(d3 >> 24) & 0xff];

        return uuid.toUpperCase();
    }

    /**
     * Computes a random float value within a given min/max range.
     *
     * @param {Number} min - The min value.
     * @param {Number} max - The max value.
     * @return {Number} The random float value.
     */
    static randFloat(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * Computes a random integer value within a given min/max range.
     *
     * @param {Number} min - The min value.
     * @param {Number} max - The max value.
     * @return {Number} The random integer value.
     */
    static randInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
}

/**
 * Implementation of the AStar algorithm.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class AStar {
    /**
     * Constructs an AStar algorithm object.
     *
     * @param {Graph} graph - The graph.
     * @param {Number} source - The node index of the source node.
     * @param {Number} target - The node index of the target node.
     */
    constructor(graph = null, source = -1, target = -1) {
        /**
         * The graph.
         * @type {?Graph}
         * @default null
         */
        this.graph = graph;

        /**
         * The node index of the source node.
         * @type {Number}
         * @default - 1
         */
        this.source = source;

        /**
         * The node index of the target node.
         * @type {Number}
         * @default - 1
         */
        this.target = target;

        /**
         * Whether the search was successful or not.
         * @type {Boolean}
         * @default false
         */
        this.found = false;

        /**
         * The heuristic of the search.
         * @type {Object}
         * @default HeuristicPolicyEuclid
         */
        this.heuristic = HeuristicPolicyEuclid;

        this._cost = new Map(); // contains the "real" accumulative cost to a node
        this._shortestPathTree = new Map();
        this._searchFrontier = new Map();
    }

    /**
     * Executes the graph search. If the search was successful, {@link AStar#found}
     * is set to true.
     *
     * @return {AStar} A reference to this AStar object.
     */
    search() {
        const outgoingEdges = new Array();
        const pQueue = new PriorityQueue(compare$1);

        pQueue.push({
            cost: 0,
            index: this.source,
        });

        // while the queue is not empty

        while (pQueue.length > 0) {
            const nextNode = pQueue.pop();
            const nextNodeIndex = nextNode.index;

            // if the shortest path tree has the given node, we already found the shortest
            // path to this particular one

            if (this._shortestPathTree.has(nextNodeIndex)) continue;

            // move this edge from the frontier to the shortest path tree

            if (this._searchFrontier.has(nextNodeIndex) === true) {
                this._shortestPathTree.set(nextNodeIndex, this._searchFrontier.get(nextNodeIndex));
            }

            // if the target has been found exit

            if (nextNodeIndex === this.target) {
                this.found = true;

                return this;
            }

            // now relax the edges

            this.graph.getEdgesOfNode(nextNodeIndex, outgoingEdges);

            for (let i = 0, l = outgoingEdges.length; i < l; i++) {
                const edge = outgoingEdges[i];

                // A* cost formula : F = G + H

                // G is the cumulative cost to reach a node

                const G = (this._cost.get(nextNodeIndex) || 0) + edge.cost;

                // H is the heuristic estimate of the distance to the target

                const H = this.heuristic.calculate(this.graph, edge.to, this.target);

                // F is the sum of G and H

                const F = G + H;

                // We enhance our search frontier in two cases:
                // 1. If the node was never on the search frontier
                // 2. If the cost to this node is better than before

                if (this._searchFrontier.has(edge.to) === false || G < this._cost.get(edge.to)) {
                    this._cost.set(edge.to, G);

                    this._searchFrontier.set(edge.to, edge);

                    pQueue.push({
                        cost: F,
                        index: edge.to,
                    });
                }
            }
        }

        this.found = false;

        return this;
    }

    /**
     * Returns the shortest path from the source to the target node as an array of node indices.
     *
     * @return {Array<Number>} The shortest path.
     */
    getPath() {
        // array of node indices that comprise the shortest path from the source to the target

        const path = new Array();

        // just return an empty path if no path to target found or if no target has been specified

        if (this.found === false || this.target === -1) return path;

        // start with the target of the path

        let currentNode = this.target;

        path.push(currentNode);

        // while the current node is not the source node keep processing

        while (currentNode !== this.source) {
            // determine the parent of the current node

            currentNode = this._shortestPathTree.get(currentNode).from;

            // push the new current node at the beginning of the array

            path.unshift(currentNode);
        }

        return path;
    }

    /**
     * Returns the search tree of the algorithm as an array of edges.
     *
     * @return {Array<Edge>} The search tree.
     */
    getSearchTree() {
        return [...this._shortestPathTree.values()];
    }

    /**
     * Clears the internal state of the object. A new search is now possible.
     *
     * @return {AStar} A reference to this AStar object.
     */
    clear() {
        this.found = false;

        this._cost.clear();
        this._shortestPathTree.clear();
        this._searchFrontier.clear();

        return this;
    }
}

/**
 * Class for representing a heuristic for graph search algorithms based
 * on the euclidean distance. The heuristic assumes that the node have
 * a *position* property of type {@link Vector3}.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class HeuristicPolicyEuclid {
    /**
     * Calculates the euclidean distance between two nodes.
     *
     * @param {Graph} graph - The graph.
     * @param {Number} source - The index of the source node.
     * @param {Number} target - The index of the target node.
     * @return {Number} The euclidean distance between both nodes.
     */
    static calculate(graph, source, target) {
        const sourceNode = graph.getNode(source);
        const targetNode = graph.getNode(target);

        return sourceNode.position.distanceTo(targetNode.position);
    }
}

/**
 * Class for representing a binary heap priority queue that enables
 * more efficient sorting of arrays. The implementation is based on
 * {@link https://github.com/mourner/tinyqueue tinyqueue}.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class PriorityQueue {
    /**
     * Constructs a new priority queue.
     *
     * @param {Function} compare - The compare function used for sorting.
     */
    constructor(compare = defaultCompare) {
        /**
         * The data items of the priority queue.
         * @type {Array<Object>}
         */
        this.data = new Array();

        /**
         * The length of the priority queue.
         * @type {Number}
         * @default 0
         */
        this.length = 0;

        /**
         * The compare function used for sorting.
         * @type {Function}
         * @default defaultCompare
         */
        this.compare = compare;
    }

    /**
     * Pushes an item to the priority queue.
     *
     * @param {Object} item - The item to add.
     */
    push(item) {
        this.data.push(item);
        this.length++;
        this._up(this.length - 1);
    }

    /**
     * Returns the item with the highest priority and removes
     * it from the priority queue.
     *
     * @return {Object} The item with the highest priority.
     */
    pop() {
        if (this.length === 0) return null;

        const top = this.data[0];
        this.length--;

        if (this.length > 0) {
            this.data[0] = this.data[this.length];
            this._down(0);
        }

        this.data.pop();

        return top;
    }

    /**
     * Returns the item with the highest priority without removal.
     *
     * @return {Object} The item with the highest priority.
     */
    peek() {
        return this.data[0] || null;
    }

    _up(index) {
        const data = this.data;
        const compare = this.compare;
        const item = data[index];

        while (index > 0) {
            const parent = (index - 1) >> 1;
            const current = data[parent];
            if (compare(item, current) >= 0) break;
            data[index] = current;
            index = parent;
        }

        data[index] = item;
    }

    _down(index) {
        const data = this.data;
        const compare = this.compare;
        const item = data[index];
        const halfLength = this.length >> 1;

        while (index < halfLength) {
            let left = (index << 1) + 1;
            let right = left + 1;
            let best = data[left];

            if (right < this.length && compare(data[right], best) < 0) {
                left = right;
                best = data[right];
            }

            if (compare(best, item) >= 0) break;

            data[index] = best;
            index = left;
        }

        data[index] = item;
    }
}

/**
 * Class for representing a planar polygon with an arbitrary amount of edges.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @author {@link https://github.com/robp94|robp94}
 */
class Polygon {
    /**
     * Constructs a new polygon.
     */
    constructor() {
        /**
         * The centroid of this polygon.
         * @type {Vector3}
         */
        this.centroid = new Vector3();

        /**
         * A reference to the first half-edge of this polygon.
         * @type {?HalfEdge}
         * @default null
         */
        this.edge = null;

        /**
         * A plane abstraction of this polygon.
         * @type {Plane}
         */
        this.plane = new Plane();
    }

    /**
     * Creates the polygon based on the given array of points in 3D space.
     * The method assumes the contour (the sequence of points) is defined
     * in CCW order.
     *
     * @param {Array<Vector3>} points - The array of points.
     * @return {Polygon} A reference to this polygon.
     */
    fromContour(points) {
        const edges = new Array();

        if (points.length < 3) {
            Logger.error("YUKA.Polygon: Unable to create polygon from contour. It needs at least three points.");
            return this;
        }

        for (let i = 0, l = points.length; i < l; i++) {
            const edge = new HalfEdge(points[i]);
            edges.push(edge);
        }

        // link edges

        for (let i = 0, l = edges.length; i < l; i++) {
            let current, prev, next;

            if (i === 0) {
                current = edges[i];
                prev = edges[l - 1];
                next = edges[i + 1];
            } else if (i === l - 1) {
                current = edges[i];
                prev = edges[i - 1];
                next = edges[0];
            } else {
                current = edges[i];
                prev = edges[i - 1];
                next = edges[i + 1];
            }

            current.prev = prev;
            current.next = next;
            current.polygon = this;
        }

        //

        this.edge = edges[0];

        //

        this.plane.fromCoplanarPoints(points[0], points[1], points[2]);

        return this;
    }

    /**
     * Computes the centroid for this polygon.
     *
     * @return {Polygon} A reference to this polygon.
     */
    computeCentroid() {
        const centroid = this.centroid;
        let edge = this.edge;
        let count = 0;

        centroid.set(0, 0, 0);

        do {
            centroid.add(edge.vertex);

            count++;

            edge = edge.next;
        } while (edge !== this.edge);

        centroid.divideScalar(count);

        return this;
    }

    /**
     * Returns true if the polygon contains the given point.
     *
     * @param {Vector3} point - The point to test.
     * @param {Number} epsilon - A tolerance value.
     * @return {Boolean} Whether this polygon contain the given point or not.
     */
    contains(point, epsilon = 1e-3) {
        const plane = this.plane;
        let edge = this.edge;

        // convex test

        do {
            const v1 = edge.tail();
            const v2 = edge.head();

            if (leftOn(v1, v2, point) === false) {
                return false;
            }

            edge = edge.next;
        } while (edge !== this.edge);

        // ensure the given point lies within a defined tolerance range

        const distance = plane.distanceToPoint(point);

        if (Math.abs(distance) > epsilon) {
            return false;
        }

        return true;
    }

    /**
     * Returns true if the polygon is convex.
     *
     * @param {Boolean} ccw - Whether the winding order is CCW or not.
     * @return {Boolean} Whether this polygon is convex or not.
     */
    convex(ccw = true) {
        let edge = this.edge;

        do {
            const v1 = edge.tail();
            const v2 = edge.head();
            const v3 = edge.next.head();

            if (ccw) {
                if (leftOn(v1, v2, v3) === false) return false;
            } else {
                if (leftOn(v3, v2, v1) === false) return false;
            }

            edge = edge.next;
        } while (edge !== this.edge);

        return true;
    }

    /**
     * Returns true if the polygon is coplanar.
     *
     * @param {Number} epsilon - A tolerance value.
     * @return {Boolean} Whether this polygon is coplanar or not.
     */
    coplanar(epsilon = 1e-3) {
        const plane = this.plane;
        let edge = this.edge;

        do {
            const distance = plane.distanceToPoint(edge.vertex);

            if (Math.abs(distance) > epsilon) {
                return false;
            }

            edge = edge.next;
        } while (edge !== this.edge);

        return true;
    }

    /**
     * Computes the signed distance from the given 3D vector to this polygon. The method
     * uses the polygon's plane abstraction in order to compute this value.
     *
     * @param {Vector3} point - A point in 3D space.
     * @return {Number} The signed distance from the given point to this polygon.
     */
    distanceToPoint(point) {
        return this.plane.distanceToPoint(point);
    }

    /**
     * Determines the contour (sequence of points) of this polygon and
     * stores the result in the given array.
     *
     * @param {Array<Vector3>} result - The result array.
     * @return {Array<Vector3>} The result array.
     */
    getContour(result) {
        let edge = this.edge;

        result.length = 0;

        do {
            result.push(edge.vertex);

            edge = edge.next;
        } while (edge !== this.edge);

        return result;
    }
}

/**
 * Class representing a plane in 3D space. The plane is specified in Hessian normal form.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class Plane {
    /**
     * Constructs a new plane with the given values.
     *
     * @param {Vector3} normal - The normal vector of the plane.
     * @param {Number} constant - The distance of the plane from the origin.
     */
    constructor(normal = new Vector3(0, 0, 1), constant = 0) {
        /**
         * The normal vector of the plane.
         * @type {Vector3}
         */
        this.normal = normal;

        /**
         * The distance of the plane from the origin.
         * @type {Number}
         */
        this.constant = constant;
    }

    /**
     * Sets the given values to this plane.
     *
     * @param {Vector3} normal - The normal vector of the plane.
     * @param {Number} constant - The distance of the plane from the origin.
     * @return {Plane} A reference to this plane.
     */
    set(normal, constant) {
        this.normal = normal;
        this.constant = constant;

        return this;
    }

    /**
     * Copies all values from the given plane to this plane.
     *
     * @param {Plane} plane - The plane to copy.
     * @return {Plane} A reference to this plane.
     */
    copy(plane) {
        this.normal.copy(plane.normal);
        this.constant = plane.constant;

        return this;
    }

    /**
     * Creates a new plane and copies all values from this plane.
     *
     * @return {Plane} A new plane.
     */
    clone() {
        return new this.constructor().copy(this);
    }

    /**
     * Computes the signed distance from the given 3D vector to this plane.
     * The sign of the distance indicates the half-space in which the points lies.
     * Zero means the point lies on the plane.
     *
     * @param {Vector3} point - A point in 3D space.
     * @return {Number} The signed distance.
     */
    distanceToPoint(point) {
        return this.normal.dot(point) + this.constant;
    }

    /**
     * Sets the values of the plane from the given normal vector and a coplanar point.
     *
     * @param {Vector3} normal - A normalized vector.
     * @param {Vector3} point - A coplanar point.
     * @return {Plane} A reference to this plane.
     */
    fromNormalAndCoplanarPoint(normal, point) {
        this.normal.copy(normal);
        this.constant = -point.dot(this.normal);

        return this;
    }

    /**
     * Sets the values of the plane from three given coplanar points.
     *
     * @param {Vector3} a - A coplanar point.
     * @param {Vector3} b - A coplanar point.
     * @param {Vector3} c - A coplanar point.
     * @return {Plane} A reference to this plane.
     */
    fromCoplanarPoints(a, b, c) {
        v1$2.subVectors(c, b).cross(v2$1.subVectors(a, b)).normalize();

        this.fromNormalAndCoplanarPoint(v1$2, a);

        return this;
    }

    /**
     * Performs a plane/plane intersection test and stores the intersection point
     * to the given 3D vector. If no intersection is detected, *null* is returned.
     *
     * Reference: Intersection of Two Planes in Real-Time Collision Detection
     * by Christer Ericson (chapter 5.4.4)
     *
     * @param {Plane} plane - The plane to test.
     * @param {Vector3} result - The result vector.
     * @return {Vector3} The result vector.
     */
    intersectPlane(plane, result) {
        // compute direction of intersection line

        d$1.crossVectors(this.normal, plane.normal);

        // if d is zero, the planes are parallel (and separated)
        // or coincident, so they’re not considered intersecting

        const denom = d$1.dot(d$1);

        if (denom === 0) return null;

        // compute point on intersection line

        v1$2.copy(plane.normal).multiplyScalar(this.constant);
        v2$1.copy(this.normal).multiplyScalar(plane.constant);

        result.crossVectors(v1$2.sub(v2$1), d$1).divideScalar(denom);

        return result;
    }

    /**
     * Returns true if the given plane intersects this plane.
     *
     * @param {Plane} plane - The plane to test.
     * @return {Boolean} The result of the intersection test.
     */
    intersectsPlane(plane) {
        const d = this.normal.dot(plane.normal);

        return Math.abs(d) !== 1;
    }

    /**
     * Projects the given point onto the plane. The result is written
     * to the given vector.
     *
     * @param {Vector3} point - The point to project onto the plane.
     * @param {Vector3} result - The projected point.
     * @return {Vector3} The projected point.
     */
    projectPoint(point, result) {
        v1$2.copy(this.normal).multiplyScalar(this.distanceToPoint(point));

        result.subVectors(point, v1$2);

        return result;
    }

    /**
     * Returns true if the given plane is deep equal with this plane.
     *
     * @param {Plane} plane - The plane to test.
     * @return {Boolean} The result of the equality test.
     */
    equals(plane) {
        return plane.normal.equals(this.normal) && plane.constant === this.constant;
    }
}

/**
 * Implementation of a half-edge data structure, also known as
 * {@link https://en.wikipedia.org/wiki/Doubly_connected_edge_list Doubly connected edge list}.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class HalfEdge {
    /**
     * Constructs a new half-edge.
     *
     * @param {Vector3} vertex - The vertex of this half-edge. It represents the head/destination of the respective full edge.
     */
    constructor(vertex = new Vector3()) {
        /**
         * The vertex of this half-edge. It represents the head/destination of the respective full edge.
         * @type {Vector3}
         */
        this.vertex = vertex;

        /**
         * A reference to the next half-edge.
         * @type {?HalfEdge}
         * @default null
         */
        this.next = null;

        /**
         * A reference to the previous half-edge.
         * @type {?HalfEdge}
         * @default null
         */
        this.prev = null;

        /**
         * A reference to the opponent half-edge.
         * @type {?HalfEdge}
         * @default null
         */
        this.twin = null;

        /**
         * A reference to its polygon/face.
         * @type {?Polygon}
         * @default null
         */
        this.polygon = null;
    }

    /**
     * Returns the tail of this half-edge. That's a reference to the previous
     * half-edge vertex.
     *
     * @return {Vector3} The tail vertex.
     */
    tail() {
        return this.prev ? this.prev.vertex : null;
    }

    /**
     * Returns the head of this half-edge. That's a reference to the own vertex.
     *
     * @return {Vector3} The head vertex.
     */
    head() {
        return this.vertex;
    }

    /**
     * Computes the length of this half-edge.
     *
     * @return {Number} The length of this half-edge.
     */
    length() {
        const tail = this.tail();
        const head = this.head();

        if (tail !== null) {
            return tail.distanceTo(head);
        }

        return -1;
    }

    /**
     * Computes the squared length of this half-edge.
     *
     * @return {Number} The squared length of this half-edge.
     */
    squaredLength() {
        const tail = this.tail();
        const head = this.head();

        if (tail !== null) {
            return tail.squaredDistanceTo(head);
        }

        return -1;
    }

    /**
     * Links the given opponent half edge with this one.
     *
     * @param {HalfEdge} edge - The opponent edge to link.
     * @return {HalfEdge} A reference to this half edge.
     */
    linkOpponent(edge) {
        this.twin = edge;
        edge.twin = this;

        return this;
    }

    /**
     * Computes the direction of this half edge. The method assumes the half edge
     * has a valid reference to a previous half edge.
     *
     * @param {Vector3} result - The result vector.
     * @return {Vector3} The result vector.
     */
    getDirection(result) {
        return result.subVectors(this.vertex, this.prev.vertex).normalize();
    }
}

const p1 = new Vector3();
const p2 = new Vector3();

/**
 * Class representing a 3D line segment.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class LineSegment {
    /**
     * Constructs a new line segment with the given values.
     *
     * @param {Vector3} from - The start point of the line segment.
     * @param {Vector3} to - The end point of the line segment.
     */
    constructor(from = new Vector3(), to = new Vector3()) {
        /**
         * The start point of the line segment.
         * @type {Vector3}
         */
        this.from = from;

        /**
         * The end point of the line segment.
         * @type {Vector3}
         */
        this.to = to;
    }

    /**
     * Sets the given values to this line segment.
     *
     * @param {Vector3} from - The start point of the line segment.
     * @param {Vector3} to - The end point of the line segment.
     * @return {LineSegment} A reference to this line segment.
     */
    set(from, to) {
        this.from = from;
        this.to = to;

        return this;
    }

    /**
     * Copies all values from the given line segment to this line segment.
     *
     * @param {LineSegment} lineSegment - The line segment to copy.
     * @return {LineSegment} A reference to this line segment.
     */
    copy(lineSegment) {
        this.from.copy(lineSegment.from);
        this.to.copy(lineSegment.to);

        return this;
    }

    /**
     * Creates a new line segment and copies all values from this line segment.
     *
     * @return {LineSegment} A new line segment.
     */
    clone() {
        return new this.constructor().copy(this);
    }

    /**
     * Computes the difference vector between the end and start point of this
     * line segment and stores the result in the given vector.
     *
     * @param {Vector3} result - The result vector.
     * @return {Vector3} The result vector.
     */
    delta(result) {
        return result.subVectors(this.to, this.from);
    }

    /**
     * Computes a position on the line segment according to the given t value
     * and stores the result in the given 3D vector. The t value has usually a range of
     * [0, 1] where 0 means start position and 1 the end position.
     *
     * @param {Number} t - A scalar value representing a position on the line segment.
     * @param {Vector3} result - The result vector.
     * @return {Vector3} The result vector.
     */
    at(t, result) {
        return this.delta(result).multiplyScalar(t).add(this.from);
    }

    /**
     * Computes the closest point on an infinite line defined by the line segment.
     * It's possible to clamp the closest point so it does not exceed the start and
     * end position of the line segment.
     *
     * @param {Vector3} point - A point in 3D space.
     * @param {Boolean} clampToLine - Indicates if the results should be clamped.
     * @param {Vector3} result - The result vector.
     * @return {Vector3} The closest point.
     */
    closestPointToPoint(point, clampToLine, result) {
        const t = this.closestPointToPointParameter(point, clampToLine);

        return this.at(t, result);
    }

    /**
     * Computes a scalar value which represents the closest point on an infinite line
     * defined by the line segment. It's possible to clamp this value so it does not
     * exceed the start and end position of the line segment.
     *
     * @param {Vector3} point - A point in 3D space.
     * @param {Boolean} clampToLine - Indicates if the results should be clamped.
     * @return {Number} A scalar representing the closest point.
     */
    closestPointToPointParameter(point, clampToLine = true) {
        p1.subVectors(point, this.from);
        p2.subVectors(this.to, this.from);

        const dotP2P2 = p2.dot(p2);
        const dotP2P1 = p2.dot(p1);

        let t = dotP2P1 / dotP2P2;

        if (clampToLine) t = MathUtils.clamp(t, 0, 1);

        return t;
    }

    /**
     * Returns true if the given line segment is deep equal with this line segment.
     *
     * @param {LineSegment} lineSegment - The line segment to test.
     * @return {Boolean} The result of the equality test.
     */
    equals(lineSegment) {
        return lineSegment.from.equals(this.from) && lineSegment.to.equals(this.to);
    }
}

/**
 * Implementation of a navigation mesh. A navigation mesh is a network of convex polygons
 * which define the walkable areas of a game environment. A convex polygon allows unobstructed travel
 * from any point in the polygon to any other. This is useful because it enables the navigation mesh
 * to be represented using a graph where each node represents a convex polygon and their respective edges
 * represent the neighborly relations to other polygons. More compact navigation graphs lead
 * to faster graph search execution.
 *
 * This particular implementation is able to merge convex polygons into bigger ones as long
 * as they keep their convexity and coplanarity. The performance of the path finding process and convex region tests
 * for complex navigation meshes can be improved by using a spatial index like {@link CellSpacePartitioning}.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @author {@link https://github.com/robp94|robp94}
 */

const pointOnLineSegment = new Vector3();
const edgeDirection = new Vector3();
const movementDirection = new Vector3();
const newPosition = new Vector3();
const lineSegment = new LineSegment();
const edges = new Array();
const closestBorderEdge = {
    edge: null,
    closestPoint: new Vector3(),
};

const lineSegment$1 = new LineSegment();

class NavMesh {
    /**
     * Constructs a new navigation mesh.
     */
    constructor() {
        /**
         * The internal navigation graph of this navigation mesh representing neighboring polygons.
         * @type {Graph}
         */
        this.graph = new Graph();
        this.graph.digraph = true;

        /**
         * The list of convex regions.
         * @type {Array<Polygon>}
         */
        this.regions = new Array();

        /**
         * A reference to a spatial index.
         * @type {?CellSpacePartitioning}
         * @default null
         */
        this.spatialIndex = null;

        /**
         * The tolerance value for the coplanar test.
         * @type {Number}
         * @default 1e-3
         */
        this.epsilonCoplanarTest = 1e-3;

        /**
         * The tolerance value for the containment test.
         * @type {Number}
         * @default 1
         */
        this.epsilonContainsTest = 1;

        /**
         * Whether convex regions should be merged or not.
         * @type {Boolean}
         * @default true
         */
        this.mergeConvexRegions = true;

        //

        this._borderEdges = new Array();
    }

    /**
     * Creates the navigation mesh from an array of convex polygons.
     *
     * @param {Array<Polygon>} polygons - An array of convex polygons.
     * @return {NavMesh} A reference to this navigation mesh.
     */
    fromPolygons(polygons) {
        this.clear();

        //

        const initialEdgeList = new Array();
        const sortedEdgeList = new Array();

        // setup list with all edges

        for (let i = 0, l = polygons.length; i < l; i++) {
            const polygon = polygons[i];

            let edge = polygon.edge;

            do {
                initialEdgeList.push(edge);

                edge = edge.next;
            } while (edge !== polygon.edge);

            //

            this.regions.push(polygon);
        }

        // setup twin references and sorted list of edges

        for (let i = 0, il = initialEdgeList.length; i < il; i++) {
            let edge0 = initialEdgeList[i];

            if (edge0.twin !== null) continue;

            for (let j = i + 1, jl = initialEdgeList.length; j < jl; j++) {
                let edge1 = initialEdgeList[j];

                if (edge0.tail().equals(edge1.head()) && edge0.head().equals(edge1.tail())) {
                    // opponent edge found, set twin references

                    edge0.linkOpponent(edge1);

                    // add edge to list

                    const cost = edge0.squaredLength();

                    sortedEdgeList.push({
                        cost: cost,
                        edge: edge0,
                    });

                    // there can only be a single twin

                    break;
                }
            }
        }

        sortedEdgeList.sort(descending);

        // half-edge data structure is now complete, begin build of convex regions

        this._buildRegions(sortedEdgeList);

        // now build the navigation graph

        this._buildGraph();

        return this;
    }

    /**
     * Clears the internal state of this navigation mesh.
     *
     * @return {NavMesh} A reference to this navigation mesh.
     */
    clear() {
        this.graph.clear();
        this.regions.length = 0;
        this.spatialIndex = null;

        return this;
    }

    /**
     * Returns the closest convex region for the given point in 3D space.
     *
     * @param {Vector3} point - A point in 3D space.
     * @return {Polygon} The closest convex region.
     */
    getClosestRegion(point) {
        const regions = this.regions;
        let closesRegion = null;
        let minDistance = Infinity;

        for (let i = 0, l = regions.length; i < l; i++) {
            const region = regions[i];

            const distance = point.squaredDistanceTo(region.centroid);

            if (distance < minDistance) {
                minDistance = distance;

                closesRegion = region;
            }
        }

        return closesRegion;
    }

    /**
     * Returns at random a convex region from the navigation mesh.
     *
     * @return {Polygon} The convex region.
     */
    getRandomRegion() {
        const regions = this.regions;

        let index = Math.floor(Math.random() * regions.length);

        if (index === regions.length) index = regions.length - 1;

        return regions[index];
    }

    /**
     * Returns the region that contains the given point. The computational overhead
     * of this method for complex navigation meshes can be reduced by using a spatial index.
     * If no convex region contains the point, *null* is returned.
     *
     * @param {Vector3} point - A point in 3D space.
     * @param {Number} epsilon - Tolerance value for the containment test.
     * @return {Polygon} The convex region that contains the point.
     */
    getRegionForPoint(point, epsilon = 1e-3) {
        let regions;

        if (this.spatialIndex !== null) {
            const index = this.spatialIndex.getIndexForPosition(point);
            regions = this.spatialIndex.cells[index].entries;
        } else {
            regions = this.regions;
        }

        //

        for (let i = 0, l = regions.length; i < l; i++) {
            const region = regions[i];

            if (region.contains(point, epsilon) === true) {
                return region;
            }
        }

        return null;
    }

    /**
     * Returns the node index for the given region. The index represents
     * the navigation node of a region in the navigation graph.
     *
     * @param {Polygon} region - The convex region.
     * @return {Number} The respective node index.
     */
    getNodeIndex(region) {
        return this.regions.indexOf(region);
    }

    /**
     * Returns a random point on the NavMesh within the given radius of the given position.
     * todo: work in progress
     */
    getRandomPointAround(position, radius = 10) {
        return new Vector3(0, 0, 0);
    }

    /**
     * Returns a random point within a area
     * todo: work in progress
     */
    getRandomPointWithinArea(positions = []) {
        return new Vector3(0, 0, 0);
    }

    /**
     * Returns false if a position is outside of the navmesh
     *
     * @param {Vector3} position - The position to test.
     * @return {bool} true = on navmesh, false = outside of navmesh
     */
    checkPoint(position) {
        let toRegion = this.getRegionForPoint(position, this.epsilonContainsTest);
        if (toRegion === null) {
            // if target are outside the navmesh, return false
            return false;
        }
        return true;
    }

    /**
     * Returns false if from or to position is outside of the navmesh
     *
     * @param {Vector3} from - The start/source position.
     * @param {Vector3} to - The end/destination position.
     * @return {bool} true = on navmesh, false = outside of navmesh
     */
    checkPath(from, to) {
        let fromRegion = this.getRegionForPoint(from, this.epsilonContainsTest);
        let toRegion = this.getRegionForPoint(to, this.epsilonContainsTest);

        if (fromRegion === null || toRegion === null) {
            // if source or target are outside the navmesh, return false
            return false;
        }

        return true;
    }

    /**
     * Returns the shortest path that leads from the given start position to the end position.
     * The computational overhead of this method for complex navigation meshes can greatly
     * reduced by using a spatial index.
     *
     * @param {Vector3} from - The start/source position.
     * @param {Vector3} to - The end/destination position.
     * @return {Array<Vector3>} The shortest path as an array of points.
     */
    findPath(from, to) {
        const graph = this.graph;
        const path = new Array();

        let fromRegion = this.getRegionForPoint(from, this.epsilonContainsTest);
        let toRegion = this.getRegionForPoint(to, this.epsilonContainsTest);

        if (fromRegion === null || toRegion === null) {
            // if source or target are outside the navmesh, choose the nearest convex region
            if (fromRegion === null) fromRegion = this.getClosestRegion(from);
            if (toRegion === null) toRegion = this.getClosestRegion(to);
        }

        // check if both convex region are identical

        if (fromRegion === toRegion) {
            // no search necessary, directly create the path

            path.push(new Vector3().copy(from));
            path.push(new Vector3().copy(to));
            return path;
        } else {
            // source and target are not in same region, perform search

            const source = this.getNodeIndex(fromRegion);
            const target = this.getNodeIndex(toRegion);

            const astar = new AStar(graph, source, target);
            astar.search();

            if (astar.found === true) {
                const polygonPath = astar.getPath();

                const corridor = new Corridor();
                corridor.push(from, from);

                // push sequence of portal edges to corridor

                const portalEdge = { left: null, right: null };

                for (let i = 0, l = polygonPath.length - 1; i < l; i++) {
                    const region = this.regions[polygonPath[i]];
                    const nextRegion = this.regions[polygonPath[i + 1]];

                    this._getPortalEdge(region, nextRegion, portalEdge);

                    corridor.push(portalEdge.left, portalEdge.right);
                }

                corridor.push(to, to);

                path.push(...corridor.generate());
            }

            return path;
        }
    }

    /**
     * This method can be used to restrict the movement of a game entity on the navigation mesh.
     * Instead of preventing any form of translation when a game entity hits a border edge, the
     * movement is clamped along the contour of the navigation mesh. The computational overhead
     * of this method for complex navigation meshes can be reduced by using a spatial index.
     *
     * @param {Vector3} startPosition - The original start position of the entity for the current simulation step.
     * @param {Vector3} endPosition - The original end position of the entity for the current simulation step.
     * @return {Vector3} The new convex region the game entity is in.
     */
    clampMovementV2(startPosition, endPosition) {
        let newRegion = this.getRegionForPoint(endPosition, this.epsilonContainsTest);
        let clampedPosition = endPosition;

        // if newRegion is null, "endPosition" lies outside of the navMesh
        if (newRegion === null) {
            // determine closest border edge
            this._getClosestBorderEdge(startPosition, closestBorderEdge);

            const closestEdge = closestBorderEdge.edge;
            const closestPoint = closestBorderEdge.closestPoint;

            // calculate movement and edge direction
            closestEdge.getDirection(edgeDirection);
            const length = movementDirection.subVectors(endPosition, startPosition).length();

            // this value influences the speed at which the entity moves along the edge
            let f = 0;

            // if startPosition and endPosition are equal, length becomes zero.
            // it's important to test this edge case in order to avoid NaN values.
            if (length !== 0) {
                movementDirection.divideScalar(length);
                f = edgeDirection.dot(movementDirection);
            }

            // calculate new position on the edge
            newPosition.copy(closestPoint).add(edgeDirection.multiplyScalar(f * length));

            // the following value "t" tells us if the point exceeds the line segment
            lineSegment$1.set(closestEdge.prev.vertex, closestEdge.vertex);
            const t = lineSegment$1.closestPointToPointParameter(newPosition, false);

            if (t >= 0 && t <= 1) {
                // point is within line segment, we can safely use the new position
                clampedPosition.copy(newPosition);
            } else {
                // check, if the new point lies outside the navMesh
                newRegion = this.getRegionForPoint(newPosition, this.epsilonContainsTest);

                if (newRegion !== null) {
                    // if not, everything is fine
                    clampedPosition.copy(newPosition);
                    return clampedPosition;
                }

                // otherwise prevent movement
                clampedPosition.copy(startPosition);
            }

            return clampedPosition;
        } else {
            // return the new region
            return clampedPosition;
        }
    }

    /**
     * This method can be used to restrict the movement of a game entity on the navigation mesh.
     * Instead of preventing any form of translation when a game entity hits a border edge, the
     * movement is clamped along the contour of the navigation mesh. The computational overhead
     * of this method for complex navigation meshes can be reduced by using a spatial index.
     *
     * @param {Polygon} currentRegion - The current convex region of the game entity.
     * @param {Vector3} startPosition - The original start position of the entity for the current simulation step.
     * @param {Vector3} endPosition - The original end position of the entity for the current simulation step.
     * @param {Vector3} clampPosition - The clamped position of the entity for the current simulation step.
     * @return {Polygon} The new convex region the game entity is in.
     */
    clampMovement(currentRegion, startPosition, endPosition, clampPosition) {
        let newRegion = this.getRegionForPoint(endPosition, this.epsilonContainsTest);

        // if newRegion is null, "endPosition" lies outside of the navMesh

        if (newRegion === null) {
            if (currentRegion === null) throw new Error("YUKA.NavMesh.clampMovement(): No current region available.");

            // determine closest border edge

            this._getClosestBorderEdge(startPosition, closestBorderEdge);

            const closestEdge = closestBorderEdge.edge;
            const closestPoint = closestBorderEdge.closestPoint;

            // calculate movement and edge direction

            closestEdge.getDirection(edgeDirection);
            const length = movementDirection.subVectors(endPosition, startPosition).length();

            // this value influences the speed at which the entity moves along the edge

            let f = 0;

            // if startPosition and endPosition are equal, length becomes zero.
            // it's important to test this edge case in order to avoid NaN values.

            if (length !== 0) {
                movementDirection.divideScalar(length);

                f = edgeDirection.dot(movementDirection);
            }

            // calculate new position on the edge

            newPosition.copy(closestPoint).add(edgeDirection.multiplyScalar(f * length));

            // the following value "t" tells us if the point exceeds the line segment

            lineSegment$1.set(closestEdge.prev.vertex, closestEdge.vertex);
            const t = lineSegment$1.closestPointToPointParameter(newPosition, false);

            //

            if (t >= 0 && t <= 1) {
                // point is within line segment, we can safely use the new position

                clampPosition.copy(newPosition);
            } else {
                // check, if the new point lies outside the navMesh

                newRegion = this.getRegionForPoint(newPosition, this.epsilonContainsTest);

                if (newRegion !== null) {
                    // if not, everything is fine

                    clampPosition.copy(newPosition);
                    return newRegion;
                }

                // otherwise prevent movement

                clampPosition.copy(startPosition);
            }

            return currentRegion;
        } else {
            // return the new region

            return newRegion;
        }
    }

    /**
     * Updates the spatial index by assigning all convex regions to the
     * partitions of the spatial index.
     *
     * @return {NavMesh} A reference to this navigation mesh.
     */
    updateSpatialIndex() {
        if (this.spatialIndex !== null) {
            this.spatialIndex.makeEmpty();

            const regions = this.regions;

            for (let i = 0, l = regions.length; i < l; i++) {
                const region = regions[i];

                this.spatialIndex.addPolygon(region);
            }
        }

        return this;
    }

    _buildRegions(edgeList) {
        const regions = this.regions;

        const cache = {
            leftPrev: null,
            leftNext: null,
            rightPrev: null,
            rightNext: null,
        };

        if (this.mergeConvexRegions === true) {
            // process edges from longest to shortest

            for (let i = 0, l = edgeList.length; i < l; i++) {
                const entry = edgeList[i];

                let candidate = entry.edge;

                // cache current references for possible restore

                cache.prev = candidate.prev;
                cache.next = candidate.next;
                cache.prevTwin = candidate.twin.prev;
                cache.nextTwin = candidate.twin.next;

                // temporarily change the first polygon in order to represent both polygons

                candidate.prev.next = candidate.twin.next;
                candidate.next.prev = candidate.twin.prev;
                candidate.twin.prev.next = candidate.next;
                candidate.twin.next.prev = candidate.prev;

                const polygon = candidate.polygon;
                polygon.edge = candidate.prev;

                if (polygon.convex() === true && polygon.coplanar(this.epsilonCoplanarTest) === true) {
                    // correct polygon reference of all edges

                    let edge = polygon.edge;

                    do {
                        edge.polygon = polygon;

                        edge = edge.next;
                    } while (edge !== polygon.edge);

                    // delete obsolete polygon

                    const index = regions.indexOf(entry.edge.twin.polygon);
                    regions.splice(index, 1);
                } else {
                    // restore

                    cache.prev.next = candidate;
                    cache.next.prev = candidate;
                    cache.prevTwin.next = candidate.twin;
                    cache.nextTwin.prev = candidate.twin;

                    polygon.edge = candidate;
                }
            }
        }

        // after the merging of convex regions, do some post-processing

        for (let i = 0, l = regions.length; i < l; i++) {
            const region = regions[i];

            // compute the centroid of the region which can be used as
            // a destination point in context of path finding

            region.computeCentroid();

            // gather all border edges used by clampMovement()

            let edge = region.edge;

            do {
                if (edge.twin === null) this._borderEdges.push(edge);

                edge = edge.next;
            } while (edge !== region.edge);
        }
    }

    _buildGraph() {
        const graph = this.graph;
        const regions = this.regions;

        // for each region, the code creates an array of directly accessible regions

        const regionNeighbourhood = new Array();

        for (let i = 0, l = regions.length; i < l; i++) {
            const region = regions[i];

            const nodeIndices = new Array();
            regionNeighbourhood.push(nodeIndices);

            let edge = region.edge;

            // iterate through all egdes of the region (in other words: along its contour)

            do {
                // check for a portal edge

                if (edge.twin !== null) {
                    const nodeIndex = this.getNodeIndex(edge.twin.polygon);

                    nodeIndices.push(nodeIndex); // the node index of the adjacent region

                    // add node for this region to the graph if necessary

                    if (graph.hasNode(this.getNodeIndex(edge.polygon)) === false) {
                        const node = new NavNode(this.getNodeIndex(edge.polygon), edge.polygon.centroid);

                        graph.addNode(node);
                    }
                }

                edge = edge.next;
            } while (edge !== region.edge);
        }

        // add navigation edges

        for (let i = 0, il = regionNeighbourhood.length; i < il; i++) {
            const indices = regionNeighbourhood[i];
            const from = i;

            for (let j = 0, jl = indices.length; j < jl; j++) {
                const to = indices[j];

                if (from !== to) {
                    if (graph.hasEdge(from, to) === false) {
                        const nodeFrom = graph.getNode(from);
                        const nodeTo = graph.getNode(to);

                        const cost = nodeFrom.position.distanceTo(nodeTo.position);

                        graph.addEdge(new NavEdge(from, to, cost));
                    }
                }
            }
        }

        return this;
    }

    _getClosestBorderEdge(point, closestBorderEdge) {
        let borderEdges;
        let minDistance = Infinity;

        if (this.spatialIndex !== null) {
            edges.length = 0;

            const index = this.spatialIndex.getIndexForPosition(point);
            const regions = this.spatialIndex.cells[index].entries;

            for (let i = 0, l = regions.length; i < l; i++) {
                const region = regions[i];

                let edge = region.edge;

                do {
                    if (edge.twin === null) edges.push(edge);

                    edge = edge.next;
                } while (edge !== region.edge);
            }

            // use only border edges from adjacent convex regions (fast)

            borderEdges = edges;
        } else {
            // use all border edges (slow)

            borderEdges = this._borderEdges;
        }

        //

        for (let i = 0, l = borderEdges.length; i < l; i++) {
            const edge = borderEdges[i];

            lineSegment$1.set(edge.prev.vertex, edge.vertex);
            const t = lineSegment$1.closestPointToPointParameter(point);
            lineSegment$1.at(t, pointOnLineSegment);

            const distance = pointOnLineSegment.squaredDistanceTo(point);

            if (distance < minDistance) {
                minDistance = distance;

                closestBorderEdge.edge = edge;
                closestBorderEdge.closestPoint.copy(pointOnLineSegment);
            }
        }

        return this;
    }

    // Determines the portal edge that can be used to reach the given polygon over its twin reference.

    _getPortalEdge(region1, region2, portalEdge) {
        let edge = region1.edge;

        do {
            if (edge.twin !== null) {
                if (edge.twin.polygon === region2) {
                    // the direction of portal edges are reversed. so "left" is the edge's origin vertex and "right"
                    // is the destintation vertex. More details in issue #5

                    portalEdge.left = edge.prev.vertex;
                    portalEdge.right = edge.vertex;
                    return portalEdge;
                }
            }

            edge = edge.next;
        } while (edge !== region1.edge);

        portalEdge.left = null;
        portalEdge.right = null;

        return portalEdge;
    }
}

/**
 * Class representing a sparse graph implementation based on adjacency lists.
 * A sparse graph can be used to model many different types of graphs like navigation
 * graphs (pathfinding), dependency graphs (e.g. technology trees) or state graphs
 * (a representation of every possible state in a game).
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class Graph {
    /**
     * Constructs a new graph.
     */
    constructor() {
        /**
         * Whether this graph is directed or not.
         * @type {Boolean}
         * @default false
         */
        this.digraph = false;

        this._nodes = new Map(); // contains all nodes in a map: (nodeIndex => node)
        this._edges = new Map(); // adjacency list for each node: (nodeIndex => edges)
    }

    /**
     * Adds a node to the graph.
     *
     * @param {Node} node - The node to add.
     * @return {Graph} A reference to this graph.
     */
    addNode(node) {
        const index = node.index;

        this._nodes.set(index, node);
        this._edges.set(index, new Array());

        return this;
    }

    /**
     * Adds an edge to the graph. If the graph is undirected, the method
     * automatically creates the opponent edge.
     *
     * @param {Edge} edge - The edge to add.
     * @return {Graph} A reference to this graph.
     */
    addEdge(edge) {
        let edges;

        edges = this._edges.get(edge.from);
        edges.push(edge);

        if (this.digraph === false) {
            const oppositeEdge = edge.clone();

            oppositeEdge.from = edge.to;
            oppositeEdge.to = edge.from;

            edges = this._edges.get(edge.to);
            edges.push(oppositeEdge);
        }

        return this;
    }

    /**
     * Returns a node for the given node index. If no node is found,
     * *null* is returned.
     *
     * @param {Number} index - The index of the node.
     * @return {Node} The requested node.
     */
    getNode(index) {
        return this._nodes.get(index) || null;
    }

    /**
     * Returns an edge for the given *from* and *to* node indices.
     * If no node is found, *null* is returned.
     *
     * @param {Number} from - The index of the from node.
     * @param {Number} to - The index of the to node.
     * @return {Edge} The requested edge.
     */
    getEdge(from, to) {
        if (this.hasNode(from) && this.hasNode(to)) {
            const edges = this._edges.get(from);

            for (let i = 0, l = edges.length; i < l; i++) {
                const edge = edges[i];

                if (edge.to === to) {
                    return edge;
                }
            }
        }

        return null;
    }

    /**
     * Gathers all nodes of the graph and stores them into the given array.
     *
     * @param {Array<Node>} result - The result array.
     * @return {Array<Node>} The result array.
     */
    getNodes(result) {
        result.length = 0;
        result.push(...this._nodes.values());

        return result;
    }

    /**
     * Gathers all edges leading from the given node index and stores them
     * into the given array.
     *
     * @param {Number} index - The node index.
     * @param {Array<Edge>} result - The result array.
     * @return {Array<Edge>} The result array.
     */
    getEdgesOfNode(index, result) {
        const edges = this._edges.get(index);

        if (edges !== undefined) {
            result.length = 0;
            result.push(...edges);
        }

        return result;
    }

    /**
     * Returns the node count of the graph.
     *
     * @return {number} The amount of nodes.
     */
    getNodeCount() {
        return this._nodes.size;
    }

    /**
     * Returns the edge count of the graph.
     *
     * @return {number} The amount of edges.
     */
    getEdgeCount() {
        let count = 0;

        for (const edges of this._edges.values()) {
            count += edges.length;
        }

        return count;
    }

    /**
     * Removes the given node from the graph and all edges which are connected
     * with this node.
     *
     * @param {Node} node - The node to remove.
     * @return {Graph} A reference to this graph.
     */
    removeNode(node) {
        this._nodes.delete(node.index);

        if (this.digraph === false) {
            // if the graph is not directed, remove all edges leading to this node

            const edges = this._edges.get(node.index);

            for (const edge of edges) {
                const edgesOfNeighbor = this._edges.get(edge.to);

                for (let i = edgesOfNeighbor.length - 1; i >= 0; i--) {
                    const edgeNeighbor = edgesOfNeighbor[i];

                    if (edgeNeighbor.to === node.index) {
                        const index = edgesOfNeighbor.indexOf(edgeNeighbor);
                        edgesOfNeighbor.splice(index, 1);

                        break;
                    }
                }
            }
        } else {
            // if the graph is directed, remove the edges the slow way

            for (const edges of this._edges.values()) {
                for (let i = edges.length - 1; i >= 0; i--) {
                    const edge = edges[i];

                    if (!this.hasNode(edge.to) || !this.hasNode(edge.from)) {
                        const index = edges.indexOf(edge);
                        edges.splice(index, 1);
                    }
                }
            }
        }

        // delete edge list of node (edges leading from this node)

        this._edges.delete(node.index);

        return this;
    }

    /**
     * Removes the given edge from the graph. If the graph is undirected, the
     * method also removes the opponent edge.
     *
     * @param {Edge} edge - The edge to remove.
     * @return {Graph} A reference to this graph.
     */
    removeEdge(edge) {
        // delete the edge from the node's edge list

        const edges = this._edges.get(edge.from);

        if (edges !== undefined) {
            const index = edges.indexOf(edge);
            edges.splice(index, 1);

            // if the graph is not directed, delete the edge connecting the node in the opposite direction

            if (this.digraph === false) {
                const edges = this._edges.get(edge.to);

                for (let i = 0, l = edges.length; i < l; i++) {
                    const e = edges[i];

                    if (e.to === edge.from) {
                        const index = edges.indexOf(e);
                        edges.splice(index, 1);
                        break;
                    }
                }
            }
        }

        return this;
    }

    /**
     * Return true if the graph has the given node index.
     *
     * @param {Number} index - The node index to test.
     * @return {Boolean} Whether this graph has the node or not.
     */
    hasNode(index) {
        return this._nodes.has(index);
    }

    /**
     * Return true if the graph has an edge connecting the given
     * *from* and *to* node indices.
     *
     * @param {Number} from - The index of the from node.
     * @param {Number} to - The index of the to node.
     * @return {Boolean} Whether this graph has the edge or not.
     */
    hasEdge(from, to) {
        if (this.hasNode(from) && this.hasNode(to)) {
            const edges = this._edges.get(from);

            for (let i = 0, l = edges.length; i < l; i++) {
                const edge = edges[i];

                if (edge.to === to) {
                    return true;
                }
            }

            return false;
        } else {
            return false;
        }
    }

    /**
     * Removes all nodes and edges from this graph.
     *
     * @return {Graph} A reference to this graph.
     */
    clear() {
        this._nodes.clear();
        this._edges.clear();

        return this;
    }

    /**
     * Transforms this instance into a JSON object.
     *
     * @return {Object} The JSON object.
     */
    toJSON() {
        const json = {
            type: this.constructor.name,
            digraph: this.digraph,
        };

        const edges = new Array();
        const nodes = new Array();

        for (let [key, value] of this._nodes.entries()) {
            const adjacencyList = new Array();

            this.getEdgesOfNode(key, adjacencyList);

            for (let i = 0, l = adjacencyList.length; i < l; i++) {
                edges.push(adjacencyList[i].toJSON());
            }

            nodes.push(value.toJSON());
        }

        json._edges = edges;
        json._nodes = nodes;

        return json;
    }

    /**
     * Restores this instance from the given JSON object.
     *
     * @param {Object} json - The JSON object.
     * @return {Graph} A reference to this graph.
     */
    fromJSON(json) {
        this.digraph = json.digraph;

        for (let i = 0, l = json._nodes.length; i < l; i++) {
            this.addNode(new Node().fromJSON(json._nodes[i]));
        }

        for (let i = 0, l = json._edges.length; i < l; i++) {
            this.addEdge(new Edge().fromJSON(json._edges[i]));
        }

        return this;
    }
}

/**
 * Base class for graph nodes.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class Node {
    /**
     * Constructs a new node.
     *
     * @param {Number} index - The unique index of this node.
     */
    constructor(index = -1) {
        /**
         * The unique index of this node. The default value *-1* means invalid index.
         * @type {Number}
         * @default -1
         */
        this.index = index;
    }

    /**
     * Transforms this instance into a JSON object.
     *
     * @return {Object} The JSON object.
     */
    toJSON() {
        return {
            type: this.constructor.name,
            index: this.index,
        };
    }

    /**
     * Restores this instance from the given JSON object.
     *
     * @param {Object} json - The JSON object.
     * @return {Node} A reference to this node.
     */
    fromJSON(json) {
        this.index = json.index;
        return this;
    }
}

/**
 * Base class for graph edges.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class Edge {
    /**
     * Constructs a new edge.
     *
     * @param {Number} from - The index of the from node.
     * @param {Number} to - The index of the to node.
     * @param {Number} cost - The cost of this edge.
     */
    constructor(from = -1, to = -1, cost = 0) {
        /**
         * The index of the *from* node.
         * @type {Number}
         * @default -1
         */
        this.from = from;

        /**
         * The index of the *to* node.
         * @type {Number}
         * @default -1
         */
        this.to = to;

        /**
         * The cost of this edge. This could be for example a distance or time value.
         * @type {Number}
         * @default 0
         */
        this.cost = cost;
    }

    /**
     * Copies all values from the given edge to this edge.
     *
     * @param {Edge} edge - The edge to copy.
     * @return {Edge} A reference to this edge.
     */
    copy(edge) {
        this.from = edge.from;
        this.to = edge.to;
        this.cost = edge.cost;

        return this;
    }

    /**
     * Creates a new edge and copies all values from this edge.
     *
     * @return {Edge} A new edge.
     */
    clone() {
        return new this.constructor().copy(this);
    }

    /**
     * Transforms this instance into a JSON object.
     *
     * @return {Object} The JSON object.
     */
    toJSON() {
        return {
            type: this.constructor.name,
            from: this.from,
            to: this.to,
            cost: this.cost,
        };
    }

    /**
     * Restores this instance from the given JSON object.
     *
     * @param {Object} json - The JSON object.
     * @return {Edge} A reference to this edge.
     */
    fromJSON(json) {
        this.from = json.from;
        this.to = json.to;
        this.cost = json.cost;

        return this;
    }
}

/**
 * Class for representing navigation edges.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments Edge
 */
class NavEdge extends Edge {
    /**
     * Constructs a navigation edge.
     *
     * @param {Number} from - The index of the from node.
     * @param {Number} to - The index of the to node.
     * @param {Number} cost - The cost of this edge.
     */
    constructor(from = -1, to = -1, cost = 0) {
        super(from, to, cost);
    }
}

/**
 * Class for representing navigation nodes.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments Node
 */
class NavNode extends Node {
    /**
     * Constructs a new navigation node.
     *
     * @param {Number} index - The unique index of this node.
     * @param {Vector3} position - The position of the node in 3D space.
     * @param {Object} userData - Custom user data connected to this node.
     */
    constructor(index = -1, position = new Vector3(), userData = {}) {
        super(index);

        /**
         * The position of the node in 3D space.
         * @type {Vector3}
         */
        this.position = position;

        /**
         * Custom user data connected to this node.
         * @type {Object}
         */
        this.userData = userData;
    }
}

/**
 * A corridor is a sequence of portal edges representing a walkable way within a navigation mesh. The class is able
 * to find the shortest path through this corridor as a sequence of waypoints. It's an implementation of the so called
 * {@link http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html Funnel Algorithm}. Read
 * the paper {@link https://aaai.org/Papers/AAAI/2006/AAAI06-148.pdf Efficient Triangulation-Based Pathfinding} for
 * more detailed information.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @author {@link https://github.com/robp94|robp94}
 */
class Corridor {
    /**
     * Creates a new corridor.
     */
    constructor() {
        /**
         * The portal edges of the corridor.
         * @type {Array<Object>}
         */
        this.portalEdges = new Array();
    }

    /**
     * Adds a portal edge defined by its left and right vertex to this corridor.
     *
     * @param {Vector3} left - The left point (origin) of the portal edge.
     * @param {Vector3} right - The right point (destination) of the portal edge.
     * @return {Corridor} A reference to this corridor.
     */
    push(left, right) {
        this.portalEdges.push({
            left: left,
            right: right,
        });

        return this;
    }

    /**
     * Generates the shortest path through the corridor as an array of 3D vectors.
     *
     * @return {Array<Vector3>} An array of 3D waypoints.
     */
    generate() {
        const portalEdges = this.portalEdges;
        const path = new Array();

        // init scan state

        let portalApex, portalLeft, portalRight;
        let apexIndex = 0,
            leftIndex = 0,
            rightIndex = 0;

        portalApex = portalEdges[0].left;
        portalLeft = portalEdges[0].left;
        portalRight = portalEdges[0].right;

        // add start point

        path.push(portalApex);

        for (let i = 1, l = portalEdges.length; i < l; i++) {
            const left = portalEdges[i].left;
            const right = portalEdges[i].right;

            // update right vertex

            if (MathUtils.area(portalApex, portalRight, right) <= 0) {
                if (portalApex === portalRight || MathUtils.area(portalApex, portalLeft, right) > 0) {
                    // tighten the funnel

                    portalRight = right;
                    rightIndex = i;
                } else {
                    // right over left, insert left to path and restart scan from portal left point

                    path.push(portalLeft);

                    // make current left the new apex

                    portalApex = portalLeft;
                    apexIndex = leftIndex;

                    // review eset portal

                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;

                    // restart scan

                    i = apexIndex;

                    continue;
                }
            }

            // update left vertex

            if (MathUtils.area(portalApex, portalLeft, left) >= 0) {
                if (portalApex === portalLeft || MathUtils.area(portalApex, portalRight, left) < 0) {
                    // tighten the funnel

                    portalLeft = left;
                    leftIndex = i;
                } else {
                    // left over right, insert right to path and restart scan from portal right point

                    path.push(portalRight);

                    // make current right the new apex

                    portalApex = portalRight;
                    apexIndex = rightIndex;

                    // reset portal

                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;

                    // restart scan

                    i = apexIndex;

                    continue;
                }
            }
        }

        if (path.length === 0 || path[path.length - 1] !== portalEdges[portalEdges.length - 1].left) {
            // append last point to path

            path.push(portalEdges[portalEdges.length - 1].left);
        }

        return path;
    }
}

/**
 * Class for loading navigation meshes as glTF assets. The loader supports
 * *glTF* and *glb* files, embedded buffers, index and non-indexed geometries.
 * Interleaved geometry data are not yet supported.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class NavMeshLoader {
    /**
     * Loads a {@link NavMesh navigation mesh} from the given URL. The second parameter can be used
     * to influence the parsing of the navigation mesh.
     *
     * @param {String} url - The URL of the glTF asset.
     * @param {Object} options - The (optional) configuration object.
     * @return {Promise} A promise representing the loading and parsing process.
     */
    load(url, options) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.arrayBuffer();
                    } else {
                        const error = new Error(response.statusText || response.status);
                        error.response = response;
                        return Promise.reject(error);
                    }
                })

                .then((arrayBuffer) => {
                    return this.parse(arrayBuffer, url, options);
                })

                .then((data) => {
                    resolve(data);
                })

                .catch((error) => {
                    Logger.error("YUKA.NavMeshLoader: Unable to load navigation mesh.", error);

                    reject(error);
                });
        });
    }

    /**
     * Use this method if you are loading the contents of a navmesh not via {@link NavMeshLoader#load}.
     * This is for example useful in a node environment.
     *
     * It's mandatory to use glb files with embedded buffer data if you are going to load nav meshes
     * in node.js.
     *
     * @param {ArrayBuffer} arrayBuffer - The array buffer.
     * @param {String} url - The (optional) URL.
     * @param {Object} options - The (optional) configuration object.
     * @return {Promise} A promise representing the parsing process.
     */
    parse(arrayBuffer, url, options) {
        const parser = new Parser();
        const decoder = new TextDecoder();
        let data;

        const magic = decoder.decode(new Uint8Array(arrayBuffer, 0, 4));

        if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
            parser.parseBinary(arrayBuffer);

            data = parser.extensions.get("BINARY").content;
        } else {
            data = decoder.decode(new Uint8Array(arrayBuffer));
        }

        const json = JSON.parse(data);

        if (json.asset === undefined || json.asset.version[0] < 2) {
            throw new Error("YUKA.NavMeshLoader: Unsupported asset version.");
        } else {
            const path = extractUrlBase(url);

            return parser.parse(json, path, options);
        }
    }
}

class Parser {
    constructor() {
        this.json = null;
        this.path = null;
        this.cache = new Map();
        this.extensions = new Map();
    }

    parse(json, path, options) {
        this.json = json;
        this.path = path;

        // read the first mesh in the glTF file

        return this.getDependency("mesh", 0).then((data) => {
            // parse the raw geometry data into a bunch of polygons

            const polygons = this.parseGeometry(data);

            // create and config navMesh
            const navMesh = new NavMesh();

            if (options) {
                if (options.epsilonCoplanarTest !== undefined) navMesh.epsilonCoplanarTest = options.epsilonCoplanarTest;
                if (options.mergeConvexRegions !== undefined) navMesh.mergeConvexRegions = options.mergeConvexRegions;
            }

            // use polygons to setup the nav mesh

            return navMesh.fromPolygons(polygons);
        });
    }

    parseGeometry(data) {
        const index = data.index;
        const position = data.position;

        const vertices = new Array();
        const polygons = new Array();

        // vertices

        for (let i = 0, l = position.length; i < l; i += 3) {
            const v = new Vector3();

            v.x = position[i + 0];
            v.y = position[i + 1];
            v.z = position[i + 2];

            vertices.push(v);
        }

        // polygons

        if (index) {
            // indexed geometry

            for (let i = 0, l = index.length; i < l; i += 3) {
                const a = index[i + 0];
                const b = index[i + 1];
                const c = index[i + 2];

                const contour = [vertices[a], vertices[b], vertices[c]];

                const polygon = new Polygon().fromContour(contour);

                polygons.push(polygon);
            }
        } else {
            // non-indexed geometry //todo test

            for (let i = 0, l = vertices.length; i < l; i += 3) {
                const contour = [vertices[i + 0], vertices[i + 1], vertices[i + 2]];

                const polygon = new Polygon().fromContour(contour);

                polygons.push(polygon);
            }
        }

        return polygons;
    }

    getDependencies(type) {
        const cache = this.cache;

        let dependencies = cache.get(type);

        if (!dependencies) {
            const definitions = this.json[type + (type === "mesh" ? "es" : "s")] || new Array();

            dependencies = Promise.all(
                definitions.map((definition, index) => {
                    return this.getDependency(type, index);
                })
            );

            cache.set(type, dependencies);
        }

        return dependencies;
    }

    getDependency(type, index) {
        const cache = this.cache;
        const key = type + ":" + index;

        let dependency = cache.get(key);

        if (dependency === undefined) {
            switch (type) {
                case "accessor":
                    dependency = this.loadAccessor(index);
                    break;

                case "buffer":
                    dependency = this.loadBuffer(index);
                    break;

                case "bufferView":
                    dependency = this.loadBufferView(index);
                    break;

                case "mesh":
                    dependency = this.loadMesh(index);
                    break;

                default:
                    throw new Error("Unknown type: " + type);
            }

            cache.set(key, dependency);
        }

        return dependency;
    }

    loadBuffer(index) {
        const json = this.json;
        const definition = json.buffers[index];

        if (definition.uri === undefined && index === 0) {
            return Promise.resolve(this.extensions.get("BINARY").body);
        }

        return new Promise((resolve, reject) => {
            const url = resolveURI(definition.uri, this.path);

            fetch(url)
                .then((response) => {
                    return response.arrayBuffer();
                })

                .then((arrayBuffer) => {
                    resolve(arrayBuffer);
                })
                .catch((error) => {
                    Logger.error("YUKA.NavMeshLoader: Unable to load buffer.", error);

                    reject(error);
                });
        });
    }

    loadBufferView(index) {
        const json = this.json;

        const definition = json.bufferViews[index];

        return this.getDependency("buffer", definition.buffer).then((buffer) => {
            const byteLength = definition.byteLength || 0;
            const byteOffset = definition.byteOffset || 0;
            return buffer.slice(byteOffset, byteOffset + byteLength);
        });
    }

    loadAccessor(index) {
        const json = this.json;
        const definition = json.accessors[index];

        return this.getDependency("bufferView", definition.bufferView).then((bufferView) => {
            const itemSize = WEBGL_TYPE_SIZES[definition.type];
            const TypedArray = WEBGL_COMPONENT_TYPES[definition.componentType];
            const byteOffset = definition.byteOffset || 0;

            return new TypedArray(bufferView, byteOffset, definition.count * itemSize);
        });
    }

    loadMesh(index) {
        const json = this.json;
        const definition = json.meshes[index];

        return this.getDependencies("accessor").then((accessors) => {
            // assuming a single primitive

            const primitive = definition.primitives[0];

            if (primitive.mode !== undefined && primitive.mode !== 4) {
                throw new Error("YUKA.NavMeshLoader: Invalid geometry format. Please ensure to represent your geometry as triangles.");
            }

            return {
                index: accessors[primitive.indices],
                position: accessors[primitive.attributes.POSITION],
                normal: accessors[primitive.attributes.NORMAL],
            };
        });
    }

    parseBinary(data) {
        const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
        let chunkIndex = 0;

        const decoder = new TextDecoder();
        let content = null;
        let body = null;

        while (chunkIndex < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                const contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
                content = decoder.decode(contentArray);
            } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                body = data.slice(byteOffset, byteOffset + chunkLength);
            }

            chunkIndex += chunkLength;
        }

        this.extensions.set("BINARY", { content: content, body: body });
    }
}

function compare$1(a, b) {
    return a.cost < b.cost ? -1 : a.cost > b.cost ? 1 : 0;
}

function descending(a, b) {
    return a.cost < b.cost ? 1 : a.cost > b.cost ? -1 : 0;
}

// from the book "Computational Geometry in C, Joseph O'Rourke"

function leftOn(a, b, c) {
    return MathUtils.area(a, b, c) >= 0;
}

// helper functions
function extractUrlBase(url = "") {
    const index = url.lastIndexOf("/");
    if (index === -1) return "./";
    return url.substr(0, index + 1);
}

function resolveURI(uri, path) {
    if (typeof uri !== "string" || uri === "") return "";
    if (/^(https?:)?\/\//i.test(uri)) return uri;
    if (/^data:.*,.*$/i.test(uri)) return uri;
    if (/^blob:.*$/i.test(uri)) return uri;
    return path + uri;
}

export { NavMeshLoader, NavMesh, Vector3 };
