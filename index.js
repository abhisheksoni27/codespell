const exec = require('child_process').exec;
const chalk = require('chalk');
const codeEditors = ['code', 'atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
const runningEditors = new Set();
const runningEditorNames = [];
const refreshTime = 1000;

setInterval(spawnProcess, refreshTime);

function spawnProcess() {
    codeEditors.forEach((codeEditor) => {
        const top = exec(`ps ax | grep ${codeEditor} -c`, (error, stdout, stderr) => {
            if (!error) {
                let data = stdout.toString().trim();
                addEditor(data, codeEditor);
            }
        });
    });
}

function addEditor(data, codeEditor) {
    let count = parseInt(data);
    if (count > 2) {
        // Process exists
        if (runningEditorNames.indexOf(codeEditor) === -1) {
            // let time = 0;

            // exec(`ps -eo comm,etime | grep 'code' | head -1`, (error, stdout, stderr) => {
            //     let timeString = stdout.toString().trim().match(/\d{1,3}/g)[0];
            //     time = timeString;
            // let secondsPassed = timeString[timeString.length - 1];
            // let minutePassed = timeString[timeString.length - 2];
            // let tempDate = new Date();
            // tempDate.setSeconds(secondsPassed);
            // tempDate.setMinutes(minutePassed);

            // if (timeString.length > 2) {
            //     let hoursPassed = timeString[0];
            //     tempDate.setHours(hoursPassed);
            // }

            // let newDate = new Date();

            // });

            runningEditors.add({
                name: codeEditor,
                // initTime: time
            });
            runningEditorNames.push(codeEditor);
        } else {
            runningEditors.forEach((codeEditor) => {
                let time;
                exec(`ps -eo comm,etime | grep ${codeEditor.name} | head -1`, (error, stdout, stderr) => {
                    let timeString = stdout.toString().trim().match(/\d{1,3}/g);
                    time = timeString.join(':');
                    codeEditor['time'] = time;
                    display(codeEditor, false);
                });
            });
        }
    }
};

function display(editor, past) {
    if (!past) {
        const name = chalk.blue(editor.name);
        const time = chalk.blue(editor.time);
        console.log('\033c')
        console.log(name, time);
    } else {
        //
    }
}