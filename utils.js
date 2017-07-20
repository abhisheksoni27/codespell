const exec = require('./promises/exec');
const fs = require('./promises/fs');

function getConsoleSize(stdout) {
    const dataString = String(stdout);
    let lines = dataString.split('\n');
    let cols = Number(lines[0].match(/^COLUMNS=([0-9]+);$/)[1]);
    return cols;
}

function hideCursor() {
    term("\033[?025l");
}

function term() {
    console.log([...arguments].join(""));
}

function deleteItem(array, index) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

function saveFile(fileName, data) {
    return fs.writeFileAsync(fileName, data)
}

module.exports = {
    term,
    hideCursor,
    saveFile,
    deleteItem,
    getConsoleSize
}