const spawn = require('child_process').spawn;

function spawnAsync(command) {
    return new Promise((resolve, reject) => {
        const spawned = spawn(command);
        let stdout = '';
        spawned.addListener('error', reject);
        spawned.on('data', function (chunk) {
            console.log(arguments);
            stdout += chunk;
        });

        spawned.on('close', function (code) {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject();
            }
        })
    });
}

spawnAsync('resize').then((data) => {
    console.log(data)
}).catch(err => {
    throw new Error(err)
});

module.exports = spawnAsync;