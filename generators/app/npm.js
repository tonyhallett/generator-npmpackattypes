var childProcess = require('child_process')
var exec = childProcess.exec

function install(file, cb) {
    exec('npm install ' + file, function (err, stdout) {
        if (err) {
            cb(err)
            return
        }

        var file = stdout.split('\n')[0]

        cb(null, file)
    })
}
function installAsync(file) {
    return new Promise((resolve, reject) => {
        install(file, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
function uninstall(file, cb) {
    exec('npm uninstall ' + file, function (err, stdout) {
        if (err) {
            cb(err)
            return
        }

        var file = stdout.split('\n')[0]

        cb(null, file)
    })
}
function uninstallAsync(file) {
    return new Promise((resolve, reject) => {
        uninstall(file, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}



module.exports = {
    install: install,
    installAsync: installAsync,
    uninstall: uninstall,
    uninstallAsync: uninstallAsync
}