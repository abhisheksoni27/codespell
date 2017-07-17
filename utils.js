const spawn = require('child_process').spawn

function getConsoleSize(cb) {
    spawn('resize').stdout.on('data', function (data) {
        data = String(data)
        var lines = data.split('\n'),
            cols = Number(lines[0].match(/^COLUMNS=([0-9]+);$/)[1]),
            lines = Number(lines[1].match(/^LINES=([0-9]+);$/)[1])
        if (cb)
            cb(cols, lines)
    })
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
    fs.writeFile(fileName, data, (err) => {
        if (err) {
            fs.mkdir(home + '/.codespell', (err) => {
                if (err) throw new Error(err);
                saveFile(fileName, data);
            });
        }
        return true;
    });
}

module.exports = {
    term,
    hideCursor,
    saveFile,
    deleteItem,
    getConsoleSize
}