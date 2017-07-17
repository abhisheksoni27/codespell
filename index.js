const editors = require('./editors.js');

const exec = require('child_process').exec;
const chalk = require('chalk');
const codeEditors = ['code', 'atom', 'subl', 'webstorm', 'nano', 'studio', 'idea'];
const runningEditors = new Set();
let runningEditorNames = [];
const refreshTime = 1000;
let count 
setInterval(spawnProcess, refreshTime);

function spawnProcess() {
    count++;
    codeEditors.forEach((codeEditor) => {
        const top = exec(`ps ax | grep ${codeEditor} -c`, (error, stdout, stderr) => {
            if (!error) {
                let data = stdout.toString().trim();
                addEditor(data, codeEditor);
            }
        });
    });
    display();
    if(!(count%10000)){
        save(runningEditors);
    }
}

function addEditor(data, codeEditor) {
    let count = parseInt(data);
    if (count > 2) {
        // Process exists
        if (runningEditorNames.indexOf(codeEditor) === -1) {
            runningEditors.add({
                name: codeEditor,
            });

            runningEditorNames.push(codeEditor);
        } else {
            runningEditors.forEach(function (codeEditor) {
                let time;
                exec(`ps -eo comm, etime | grep ${codeEditor.name} | head -1`, (error, stdout, stderr) => {
                    let timeString = stdout.toString().trim().match(/\d{1,3}/g);

                    // Editor has been closed
                    if (!timeString) {
                        const index = runningEditorNames.indexOf(codeEditor.name);
                        runningEditorNames = [...runningEditorNames.slice(0, index), ...runningEditorNames.slice(index + 1)];
                        runningEditors.delete(codeEditor);
                        save(codeEditor);
                        return;
                    };
                    time = timeString.join(':');
                    codeEditor['time'] = time;
                });
            });
        }
    }
};

function display() {
    console.log("\033c");
    runningEditors.forEach(editor => {
        const name = editor.name;
        const fullName = chalk.blue(editors[name]) + chalk.white('💻');
        if (!editor.time) {
            console.log("Loading..")
            return;
        } else {
            const time = chalk.green(editor.time);
            console.log(fullName, time);
        }
    })
}

function displayPast() {

};

function save(codeEditor){
}