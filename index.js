const editors = require('./editors.js');
const timeUtils = require('./timeUtil.js');
const utils = require('./utils.js');

// const exec = require('child_process').exec;
const exec = require('./promises/exec');
// const fs = require('fs');
const fs = require('./promises/fs');
const chalk = require('chalk');
const codeEditors = ['atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
let runningEditors = [];
let runningEditorNames = [];
const refreshTime = 1000;
let count = 0;
let fileDataIndex = 0;
let colors = ['blue', 'red', 'green', 'grey', 'cyan'];
const saveTime = 5;
const laptop = chalk.white('💻');
const ESC = '\033[';
let fileStore = [];

utils.hideCursor();

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

function execAndAdd(codeEditor) {
    const top = exec(`ps ax | grep ${codeEditor} -c`)
        .then((stdout, stderr) => {
            let data = stdout.toString().trim();
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
            runningEditors.forEach(addResult);
        }
    }
};

function addResult(codeEditor, index) {
    let time;

    exec(`ps -eo comm,etime | grep ${codeEditor.name} | head -1`)
        .then((stdout, stderr) => {
            let timeString = stdout.toString().trim().match(/\d{1,3}/g);

            if (!timeString) {
                codeEditor.close = !codeEditor.close;
                save(runningEditors, index);
                return;
            };

            time = codeEditor.time ?
                timeUtils.incrementTime(codeEditor.time).join(":") :
                timeString.join(":");

            codeEditor['time'] = time;
        });
}

function display() {
    utils.term('\033c');

    // Metadata gone. Print again.
    displayMetadata();
    displayPast(true);

    runningEditors.forEach((editor, index) => {
        const name = editor.name;
        const fullName = chalk.blue(editors[name]) + laptop;
        if (!editor.time) {
            utils.term('Loading..')
            return;
        } else {
            utils.hideCursor();

            const time = chalk.green(editor.time);
            const escapeString = '\033[' + (5 + fileDataIndex + index) + ';0f';

            utils.term(`${escapeString} ${fullName}: ${time}`);
        }
    })
}

function displayPast(flag) {
    const date = new Date();
    const lastDay = new Date(date.setDate(date.getDate()))
        .toDateString()
        .split(' ')
        .join('-');

    if (!flag) {

        const fileName = `codespell-${lastDay}.json`;

        fs.readFileAsync(fileName)
            .then((data) => {
                const fileData = JSON.parse(data.toString());

                utils.term(`${ESC}2;0f${chalk.bgGreen(lastDay).split('-').join(' ')}`);

                fileData.forEach((entry, index) => {
                    const name = editors[entry.name];
                    const time = entry.time;
                    utils.term(`${ESC}${3 + index * 2};0f${name} ${laptop}: ${time}`);
                });

                fileDataIndex = fileData.length * 2;
                utils.term(`${ESC}${3 + fileDataIndex};0f${chalk.bgRed(date.toDateString())}`);
                fileStore = [...fileData];

            })
            .catch(errCallback);

    } else {
        utils.term(`${ESC}2;0f${chalk.bgGreen(lastDay).split('-').join(' ')}`);
        fileStore.forEach((entry, index) => {
            const name = editors[entry.name];
            const time = entry.time;
            utils.term(`${ESC}${3 + index * 2};0f${name} ${laptop}: ${time}`);
        });
        utils.term(`${ESC}${3 + fileDataIndex};0f${chalk.bgRed(date.toDateString())}`);
    }
}

function displayMetadata() {
    utils.term('\033c');
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
        console.log('here');
        return;
    }

    const initData = JSON.stringify(codeEditors);
    const date = new Date().toDateString().split(' ').join('-');
    let fileName = `codespell-${date}.json`;
    // const home = require('os').homedir();
    // fileName = home + '/.codespell/' + fileName;

    fs.statAsync(fileName)
        .then((stats) => {
            if (stats) return fs.readFileAsync(fileName);
        })
        .catch((err) => {
            return utils.saveFile(fileName, initData);
        })
        .then((data) => {
            let finalData = [];
            const fileData = JSON.parse(data.toString());
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

                        let time = timeUtils.parseTime('00:00');

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
                        closedEditor.time = time.join(":");
                        runningEditors[closedEditorIndex] = closedEditor;

                        finalData.push({
                            name,
                            time: time.join(':'),
                            close: false
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
        });
}

function errCallback(err) {
    throw new Error(err);
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