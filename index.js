const editors = require('./editors.js');
const timeUtils = require('./timeUtil.js');
const utils = require('./utils.js');

const exec = require('child_process').exec;
const spawn = require('child_process').spawn
const fs = require('fs');
const chalk = require('chalk');
const codeEditors = ['code', 'atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
let runningEditors = [];
let runningEditorNames = [];
const refreshTime = 1000;
let count = 0;
const saveTime = 5;

displayMetadata();
utils.hideCursor();

setInterval(spawnProcess, refreshTime);

function spawnProcess() {
    count++;
    codeEditors.forEach(spawnAndAdd);
    display();

    if (!(count % saveTime)) {
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
                close: false
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
            codeEditor.close = !codeEditor.close;
            save(runningEditors, index);
            return;
        };

        time = timeString.join(':');
        codeEditor['time'] = time;
    });
}

function display() {
    // utils.term('\033c');

    // Metadata gone. Print again.
    displayMetadata();

    runningEditors.forEach((editor, index) => {
        const name = editor.name;
        const fullName = chalk.blue(editors[name]) + chalk.white('💻');
        if (!editor.time) {
            utils.term('Loading..')
            return;
        } else {
            utils.hideCursor();

            const time = chalk.green(editor.time);
            const escapeString = "\033[" + (2 + index) + ";0f";

            utils.term(`${escapeString} ${fullName}: ${time}`);
        }
    })
}

function displayMetadata() {
    utils.term('\033c');

    utils.getConsoleSize((cols, lines) => {
        const title = chalk.bgBlue.white('CodeSpell');
        utils.term("\033[1;" + (Math.floor(cols / 2) - 2) + "f" + title);
    });

};

function save(codeEditors, index) {
    const initData = JSON.stringify(codeEditors);
    const date = new Date().toDateString().split(" ").join("-");
    let fileName = `codespell-${date}.json`;
    const home = require('os').homedir();
    fileName = home + "/.codespell/" + fileName;

    fs.stat(fileName, (err, exists) => {
        //File Exists   
        if (exists && !err) {
            // Read File
            fs.readFile(fileName, (err, data) => {
                if (err) throw new Error(err);

                const temp = JSON.parse(data.toString());
                const finalData = [];
                // For each entry (code editor)
                temp.forEach((entry) => {
                    codeEditors.forEach((editor) => {

                        if (editor.name === temp.name) {
                            // Add
                            const savedTime = timeUtil.parseTime(entry.time);
                            const newTime = timeUtil.parseTime(editor.time);
                            entry.time = [...timeUtil.addTime(savedTime, newTime).values()].join(":");
                            finalData.push(entry);
                        }
                    });
                    if (entry.close) {
                        console.log(finalData);
                        finalData.push(entry);
                    }
                });
                utils.saveFile(fileName, JSON.stringify(finalData));
                if (!isNaN(index)) {
                    runningEditorNames = utils.deleteItem(runningEditorNames, index);
                    runningEditors = utils.deleteItem(runningEditors, index);
                }
            });
        } else {
            // File doesn't exist.
            console.log(JSON.stringify(initData));
            utils.saveFile(fileName, initData);
            if (!isNaN(index)) {
                runningEditorNames = utils.deleteItem(runningEditorNames, index);
                runningEditors = utils.deleteItem(runningEditors, index);
            }
        }
    });
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