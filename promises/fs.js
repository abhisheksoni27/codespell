const fs = require('fs');

function readFileAsync(fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

function statAsync(fileName) {
    return new Promise((resolve, reject) => {
        fs.stat(fileName, (err, stats) => {
            if (err) reject(err);
            resolve(stats);
        });
    });
}

function writeFileAsync(fileName, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
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

module.exports = {
    readFileAsync,
    statAsync,
    writeFileAsync,
    mkdirAsync,
    unlinkAsync
};