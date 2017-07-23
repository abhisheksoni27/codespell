const fs = require('fs');

function readFileAsync(fileName) {
    return fs.readFileSync(fileName);
}

function mkdirAsync(path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

function unlinkAsync(fileName) {
    return new Promise((resolve, reject) => {
        fs.unlink(fileName, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

function exists(fileName) {
    return fs.existsSync(fileName);
}

module.exports = {
    readFileAsync,
    mkdirAsync,
    unlinkAsync,
    exists
};