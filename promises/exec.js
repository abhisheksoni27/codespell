const exec = require('child_process').exec;

function execAsync(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) reject();
            resolve(stdout, stderr);
        })
    });
}

module.exports = execAsync;