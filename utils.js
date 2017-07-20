const spawn = require('./promises/spawn');
const fs = require('./promises/fs');

function getConsoleSize() {
    return new Promise((resolve, reject) => {
        spawn('resize')
            .then((data) => {
                const dataString = String(data);
                let lines = data.split('\n');
                lines = Number(lines[1].match(/^LINES=([0-9]+);$/)[1]);
                let cols = Number(lines[0].match(/^COLUMNS=([0-9]+);$/)[1]);
                resolve(lines, cols);
            })
            .catch((err) => {
                reject(err);
            })
    });

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