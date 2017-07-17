const editors = require('./editors.js');

const exec = require('child_process').exec;
const spawn = require('child_process').spawn
const chalk = require('chalk');
const codeEditors = ['code', 'atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
let runningEditors = [];
let runningEditorNames = [];
const refreshTime = 1000;
let count = 0;

displayMetadata();
hideCursor();

setInterval(spawnProcess, refreshTime);

function spawnProcess() {
    count++;
    codeEditors.forEach(spawnAndAdd);

    display();

    if (!(count % 10000)) {
        save(runningEditors);
    }
}

function spawnAndAdd(codeEditor) {
    const top = exec(`ps ax | grep ${codeEditor} -c`, (error, stdout, stderr) => {
        if (!error) {
            let data = stdout.toString().trim();
            addEditor(data, codeEditor);
        }
    });
}

function addEditor(data, codeEditor) {
    let count = parseInt(data);
    if (count > 2) {
        // Process exists
        if (runningEditorNames.indexOf(codeEditor) === -1) {
            runningEditors.push({
                name: codeEditor,
            });

            runningEditorNames.push(codeEditor);
        } else {
            runningEditors.forEach(editorClosed);
        }
    }
};

function editorClosed(codeEditor, index) {
    let time;
    exec(`ps -eo comm,etime | grep ${codeEditor.name} | head -1`, (error, stdout, stderr) => {
        let timeString = stdout.toString().trim().match(/\d{1,3}/g);

        // Editor has been closed
        if (!timeString) {
            runningEditorNames = deleteItem(runningEditorNames, index);
            runningEditors = deleteItem(runningEditors, index)
            save(codeEditor);
            return;
        };

        time = timeString.join(':');
        codeEditor['time'] = time;
    });
}

function display() {
    term('\033c');

    // Metadata gone. Print again.
    displayMetadata();

    runningEditors.forEach((editor, index) => {
        const name = editor.name;
        const fullName = chalk.blue(editors[name]) + chalk.white('💻');
        if (!editor.time) {
            term('Loading..')
            return;
        } else {
            hideCursor();

            const time = chalk.green(editor.time);
            const escapeString = "\033[" + (2 + index) + ";0f";

            term(`${escapeString} ${fullName}: ${time}`);
        }
    })
}

function displayMetadata() {
    term('\033c');

    getConsoleSize((cols, lines) => {
        const title = chalk.bgBlue.white('CodeSpell');
        term("\033[1;" + (Math.floor(cols / 2) - 2) + "f" + title);
    });

};

function save(codeEditor) {}

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

/**
 * https://stackoverflow.com/a/14861513/2231031
 */
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {

    // Clear console
    console.log("\033c");
    process.exit();
});