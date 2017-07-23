const exec = require('./promises/exec');
const fs = require('fs');

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
    if(index===undefined) return array;
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

function saveFile(fileName, data) {
    fs.writeFileSync(fileName, data);
}

module.exports = {
    term,
    hideCursor,
    saveFile,
    deleteItem,
    getConsoleSize
}