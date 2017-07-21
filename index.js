#!/usr/bin/env node
const chalk = require('chalk');

const editors = require('./editors.js');
const timeUtils = require('./timeUtil.js');
const utils = require('./utils.js');
const exec = require('./promises/exec');
const fs = require('./promises/fs');

const home = require('os').homedir();

const codeEditors = ['atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
let colors = [
    'bgBlack', 'bgRed', 'bgGreen',
    'bgCyan', 'bgBlue', 'bgMagenta', 'bgYellow'
];

const laptop = '💻';
const boom = '💥'
const sparkles = '✨'
const ESC = '\033[';

let runningEditors = [];
let runningEditorNames = [];
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
    codeEditors.forEach(execAndAdd);
    display();

    if (!(count % saveTime) && runningEditors.length > 0) {
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
            addEditor(data, codeEditor);
        })
        .catch(errCallback);
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
            addResult(codeEditor);
        }
    }
};

function addResult(codeEditor, index) {
    debugger;
    exec(`ps -eo comm,etime | grep ${codeEditor} | head -1`)
        .then((stdout, stderr) => {
            let timeString = String(stdout).trim().match(/\d{1,3}/g);
            let time;
            let runningEditor = runningEditors.find((editor) => {
                return editor.name === codeEditor;
            });

            let runningEditorIndex = runningEditors.findIndex((editor) => {
                return editor.name === codeEditor;
            });

            if (!timeString) {
                runningEditor.close = !runningEditor.close;
                save(runningEditors, index);
                return;
            };

            const timeOne = timeUtils.incrementTime(runningEditor.time).join(':');

            time = runningEditor.time ?
                timeOne :
                timeString.join(':');

            runningEditor['time'] = time;
        });
}

function display() {
    utils.term('\033c');

    // Metadata gone. Print again.
    displayMetadata();
    displayPast(true);

    runningEditors.forEach((editor, index) => {
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
    })
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

        fs.readFileAsync(fileName)
            .then((data) => {
                const fileData = JSON.parse(String(data));

                utils.term(`${ESC}2;0f${chalk.bgGreen(lastDay).split('-').join(' ')}`);

                fileData.forEach((entry, index) => {
                    const name = chalk[randomColor()].white(editors[entry.name]);
                    const time = chalk.blue(entry.time);
                    chalk.black
                    utils.term(`${ESC}${4 + index};2f${name} ${laptop}: ${time} ${boom}`);
                });

                fileDataIndex = fileData.length * 2;
                utils.term(`${ESC}${3 + fileDataIndex};0f${chalk.bgRed(today)}`);
                fileStore = [...fileData];

            })
            .catch((err) => {
                return err;
            });

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
    if (codeEditors.length === 0) {
        return;
    }

    const initData = JSON.stringify(codeEditors);
    const date = new Date().toDateString().split(' ').join('-');
    let fileName = `codespell-${date}.json`;
    fileName = home + '/.codespell/' + fileName;

    fs.statAsync(fileName)
        .then((stats) => {
            if (stats) return fs.readFileAsync(fileName);
        })
        .catch((err) => {
            return utils.saveFile(fileName, initData);
        })
        .then((data) => {
            let finalData = [];
            const fileData = JSON.parse(String(data));
            const closed = fileData.filter(entry => entry.close);
            const tempData = [...fileData, ...codeEditors];
            if (!(closed.length > 0)) {
                finalData = [...codeEditors];
            } else {
                const closedNames = closed.map(entry => entry.name);

                closedNames.forEach(name => {
                    const c = tempData.filter(data => data.name === name);

                    if (c.length === 1) {
                        finalData.push(c[0]);
                    } else {

                        let time = timeUtils.parseTime('00:00:00');

                        c.forEach((entry) => {
                            const entryTime = timeUtils.parseTime(entry.time);
                            time = timeUtils.addTime(time, entryTime);
                        });

                        const closedEditor = runningEditors.find((editor) => {
                            return editor.name === name
                        });
                        const closedEditorIndex = runningEditors.findIndex((editor) => {
                            return editor.name === name
                        });

                        closedEditor.time = time.join(':');
                        runningEditors[closedEditorIndex] = closedEditor;

                        finalData.push({
                            name,
                            time: time.join(':'),
                            close: !closedEditor.close
                        });
                    }
                });

                const notClosed = codeEditors.filter((entry) => {
                    if (closedNames.indexOf(entry.name) === -1) {
                        return true;
                    }
                    return false;
                });

                notClosed.forEach((entry) => {
                    finalData.push(entry)
                });
            }
            return finalData;
        })
        .then((finalData) => {
            return utils.saveFile(fileName, JSON.stringify(finalData));
        })
        .then(() => {
            if (!isNaN(index)) {
                runningEditorNames = utils.deleteItem(runningEditorNames, index);
                runningEditors = utils.deleteItem(runningEditors, index);
            }
        })
}

function errCallback(err) {
    return err;
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
    process.exit();
});