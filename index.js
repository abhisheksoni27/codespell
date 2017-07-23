#!/usr/bin/env node

const chalk = require('chalk');

const editors = require('./editors.js');
const timeUtils = require('./timeUtil.js');
const utils = require('./utils.js');
const exec = require('./promises/exec');
const fs = require('./promises/fs');
const fsOriginal = require('fs');

const home = require('os').homedir();

const codeEditorsNames = ['atom', 'subl', 'vscode', 'webstorm', 'nano', 'studio', 'idea'];
let colors = [
    'bgBlack', 'bgRed', 'bgGreen',
    'bgCyan', 'bgBlue', 'bgMagenta', 'bgYellow'
];

const laptop = '💻';
const boom = '💥'
const sparkles = '✨'
const ESC = '\033[';

const date = new Date().toDateString().split(' ').join('-');
let fileName = `codespell-${date}.json`;
fileName = home + '/.codespell/' + fileName;

let runningEditors;
let runningEditorNames;

try {
    const readFileData = fsOriginal.readFileSync(fileName);
    runningEditors = JSON.parse(String(readFileData));

    const names = runningEditors.editors.map(editor => editor.name);
    runningEditorNames = [...names];
} catch (err) {
    runningEditors = {
        closedEditorNames: [],
        closedEditors: [],
        editors: []
    };

    runningEditorNames = [];
}


const refreshTime = 1000;
let count = 0;
let fileDataIndex = 0;
const saveTime = 5;
let fileStore = [];

utils.hideCursor();
utils.term('\033c');

displayMetadata()
displayPast();

setInterval(execProcess, refreshTime);

function execProcess() {
    count++;
    codeEditorsNames.forEach(execAndAdd);
    display();

    if (!(count % saveTime) && runningEditors.editors.length > 0) {
        save(runningEditors);
    }
}

function execAndAdd(codeEditor, index) {
    exec(`ps ax | grep ${codeEditor} -c`)
        .then((stdout, stderr) => {
            let data = String(stdout).trim();
            return data;
        })
        .then((data) => {
            addEditor(data, codeEditor, index);
        })
        .catch(errCallback);
}

function addEditor(data, codeEditor, index) {
    let count = parseInt(data);
    if (count > 2) {
        // Process exists
        if (runningEditorNames.indexOf(codeEditor) === -1) {
            runningEditors.editors.push({
                name: codeEditor
            });

            runningEditorNames.push(codeEditor);
        } else {
            addResult(codeEditor);
        }
    } else {
        // Check if this still exists in editors because of time lag

        if (runningEditorNames.indexOf(codeEditor) !== -1) {
            
            let runningEditor = runningEditors.editors.find((editor) => {
                return editor.name === codeEditor;
            });

            let runningEditorIndex = runningEditors.editors.findIndex((editor) => {
                return editor.name === codeEditor;
            });

            runningEditors.closedEditors.push(runningEditor);
            runningEditors.closedEditorNames.push(runningEditor.name);
            runningEditors.editors = utils
                .deleteItem(runningEditors.editors, runningEditorIndex)
            runningEditorNames = utils
                .deleteItem(runningEditorNames, runningEditorIndex);
            return;
        };
    }
};

function addResult(codeEditor) {
    exec(`ps -eo comm,etime | grep ${codeEditor} | head -1`)
        .then((stdout, stderr) => {
            let timeString = String(stdout).trim().match(/\d{1,3}/g);
            let time;

            let runningEditor = runningEditors.editors.find((editor) => {
                return editor.name === codeEditor;
            });

            let runningEditorIndex = runningEditors.editors.findIndex((editor) => {
                return editor.name === codeEditor;
            });

            if (!timeString) {
                runningEditors.closedEditors.push(runningEditor);
                runningEditors.closedEditorNames.push(runningEditor.name);
                runningEditors.editors = utils
                    .deleteItem(runningEditors.editors, runningEditorIndex)
                runningEditorNames = utils
                    .deleteItem(runningEditorNames, runningEditorIndex);
                return;
            };

            // Check if this editor was closed

            if (runningEditors.closedEditorNames.indexOf(codeEditor) !== -1) {

                let closedEditor = runningEditors.closedEditors.find((editor) => {
                    return editor.name === codeEditor
                });

                let closedEditorIndex = runningEditors.closedEditors
                    .findIndex((editor) => {
                        return editor.name === codeEditor
                    });

                let finalTime = timeUtils.addTime(closedEditor.time, timeString.join(":"));

                runningEditor["time"] = timeUtils.formatTime(finalTime);

                runningEditors.closedEditors = utils
                    .deleteItem(runningEditors.closedEditors, closedEditorIndex);

                runningEditors.closedEditorNames = utils
                    .deleteItem(runningEditors.closedEditorNames, closedEditorIndex);
            } else {

                time = runningEditor.time ?
                    timeUtils.incrementTime(runningEditor.time) :
                    timeString;

                runningEditor['time'] = timeUtils.formatTime(time);
            }
        });
}

function display() {
    utils.term('\033c');

    // Metadata gone. Print again.
    displayMetadata();
    displayPast(true);

    runningEditors.editors.forEach((editor, index) => {
        const name = editor.name;
        const fullName = chalk[colors[index * 2]].white(editors[name]) + laptop;
        if ((!editor.time) && (!editor.close)) {
            (index === 0) ? utils.term('\nLoading..'): utils.term('Loading..');
            return;
        } else {
            utils.hideCursor();

            const time = chalk.yellow(editor.time);
            const escapeString = '\033[' + (5 + fileDataIndex + index) + ';0f';

            utils.term(`${escapeString} ${fullName}: ${time} ${sparkles}`);
        }
    });
}

function displayPast(flag) {
    const date = new Date();
    const today = date.toDateString();
    const lastDay = new Date(date.setDate(date.getDate() - 1))
        .toDateString()
        .split(' ')
        .join('-');

    if (!flag) {

        let fileName = `codespell-${lastDay}.json`;
        fileName = home + '/.codespell/' + fileName;

        const data = fs.readFileAsync(fileName)
        const fileData = JSON.parse(String(data));

        utils.term(`${ESC}2;0f${chalk.bgGreen(lastDay).split('-').join(' ')}`);

        fileData.closedEditors.forEach((entry, index) => {
            const name = chalk[randomColor()].white(editors[entry.name]);
            const time = chalk.blue(entry.time);
            chalk.black
            utils.term(`${ESC}${4 + index};2f${name} ${laptop}: ${time} ${boom}`);
        });

        fileDataIndex = fileData.closedEditors.length * 2;
        utils.term(`${ESC}${3 + fileDataIndex};0f${chalk.bgRed(today)}`);
        fileStore = [...fileData.closedEditors];

    } else {
        utils.term(`${ESC}2;0f${chalk.bgGreen(lastDay).split('-').join(' ')}`);

        fileStore.forEach((entry, index) => {
            const name = chalk[randomColor()].white(editors[entry.name]);
            const time = chalk.blue(entry.time);
            utils.term(`${ESC}${4 + index};2f${name} ${laptop}: ${time} ${boom}`);
        });

        utils.term(`${ESC}${4 + fileDataIndex};0f${chalk.bgRed(today)}`);
    }
}

function displayMetadata() {
    const title = chalk.bgBlue.white('CodeSpell');
    exec('resize')
        .then((stdout, stderr) => {
            const columns = utils.getConsoleSize(stdout);
            utils.term(`${ESC}` + '1;' + (Math.floor(columns / 2) - 3) + 'f' + title);
        })
        .catch(errCallback);
};

function save(codeEditors, index) {

    if (!fsOriginal.existsSync(fileName)) {
        utils.saveFile(fileName, JSON.stringify(codeEditors, null, 4));
        return;
    } else {
        //File Exists

        /**
         * Three Cases:
         * 1. Every editor is false.
         * 2. One is true, others are false.
         * 3. One has true, and false entries, the rest are all false.
         */

        // First Case
        // if (runningEditors.closedEditorNames.length === 0) {
        // return;
        // } 

        utils.saveFile(fileName, JSON.stringify(codeEditors, null, 4));
        return;
    }
}

function errCallback(err) {
    console.log(err)
}

function randomColor() {
    return colors[Math.floor(Math.random() * 7)];
}

/**
 * https://stackoverflow.com/a/14861513/2231031
 */
if (process.platform === 'win32') {
    var rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('SIGINT', function () {
        process.emit('SIGINT');
    });
}

process.on('SIGINT', function () {

    // Clear console
    console.log('\033c');

    const names = runningEditors.editors.map(editor => editor.name);
    runningEditors.closedEditorNames.push(...names);
    runningEditors.closedEditors.push(...runningEditors.editors);

    process.exit();
});