'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

let handle;
let isClosing = false;
function create(filepath) {
    if (fs__default['default'].existsSync(filepath)) {
        const moveTo = `${path__default['default'].basename(filepath)}.bkp`;
        console.log(`Moving previous "${path__default['default'].basename(filepath)}" file to "${moveTo}"`);
        fs__default['default'].renameSync(filepath, path__default['default'].resolve(path__default['default'].dirname(filepath), moveTo));
    }
    handle = fs__default['default'].createWriteStream(filepath);
}
function write(contents, close) {
    if (!handle || isClosing) {
        return;
    }
    if (close) {
        isClosing = true;
    }
    return new Promise((resolve, reject) => {
        const now = new Date();
        handle.write(`[${now.toLocaleString()}] ${contents}\n`, (err) => {
            if (err) {
                return reject(err);
            }
            if (isClosing) {
                handle.close();
            }
            resolve();
        });
    });
}

exports.create = create;
exports.write = write;
//# sourceMappingURL=logWriter.js.map
