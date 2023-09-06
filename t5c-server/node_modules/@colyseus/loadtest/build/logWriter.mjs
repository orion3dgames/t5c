import path from 'path';
import fs from 'fs';

let handle;
let isClosing = false;
function create(filepath) {
    if (fs.existsSync(filepath)) {
        const moveTo = `${path.basename(filepath)}.bkp`;
        console.log(`Moving previous "${path.basename(filepath)}" file to "${moveTo}"`);
        fs.renameSync(filepath, path.resolve(path.dirname(filepath), moveTo));
    }
    handle = fs.createWriteStream(filepath);
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

export { create, write };
//# sourceMappingURL=logWriter.mjs.map
