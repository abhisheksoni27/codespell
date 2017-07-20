const spawn = require('child_process').spawn;

function spawnAsync(command, args, options) {
    return new Promise((resolve, reject) => {
        const spawned = spawn(command, args, options);
        spawned.on('data', (data) => {
            resolve(data);
        });

        spawned.on('error', (err) => {
            reject(data);
        });
    });
}

module.exports = spawnAsync;