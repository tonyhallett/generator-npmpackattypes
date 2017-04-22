'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const packandextract = require('packandextract');
const path = require('path');
const del = require('delete');
const merge = require('deepmerge');
const fsp = require('fs-promise');
const npm = require('./npm');
const tmp = require('tmp');
const storeClass = require('./store');



var getDirectoriesAsync = function (dirPath) {
    return fsp.readdir(dirPath).then(entries => {
        var fsStatPromises = entries.map(entry => {
            var statPath = path.join(dirPath, entry);
            return fsp.stat(statPath);
        });
        return Promise.all(fsStatPromises).then(stats => entries.filter((e, index) => stats[index].isDirectory()));
    })
}


var tmpdirAsync = function (options) {
    //Simple temporary directory creation, it will be removed on process exit.
//If the directory still contains items on process exit, then it won't be removed.
//If you want to cleanup the directory even when there are entries in it, then you can pass
//the unsafeCleanup option when creating it.
//or call the cleanupCallback
    return new Promise((resolve, reject) => {
        var cb = function (err, path, cleanupCallback) {
            if (err) {
                reject(err);
            } else {
                resolve({ path: path, cleanupCallback: cleanupCallback });
            }
        }
        if (options) {
            tmp.dir(options, cb);
        } else {
            tmp.dir(cb);
        }
    })
}
var packandextractAsync = function (packArg, relativeDirectory, filter, deleteGzippedTarball) {
    return new Promise((resolve, reject) => {
        packandextract(packArg, relativeDirectory, () => {
            //at the moment packandextract is swallowing all errors
            resolve();
        },filter, deleteGzippedTarball)
    });
}
var typesPath = 'node_modules/@types/';


module.exports = class extends Generator {
    
    constructor(args, opts) {   
        super(args, opts);
        this.argument("pack", { required: true });
        this.option("delete", { alias: 'd' });
        this._packFolders = [];
        this._atTypes = [];
        this._installedPacks = [];
    }

    _uninstall() {
        return this._store.retrieveAndRemove(this.options.pack).then(foldersAndAtTypes => {
            if (foldersAndAtTypes) {
                var deleteFolderPromises = foldersAndAtTypes.packFolders.map(packFolder => fsp.remove(this.destinationPath(typesPath + packFolder)));
                //uninstall not working with version !
                var uninstallAtTypesPromises = foldersAndAtTypes.atTypes.map(atType => npm.uninstallAsync('--save ' + atType));
                return Promise.all(deleteFolderPromises.concat(uninstallAtTypesPromises));
            } else {
                Promise.resolve();
            }
        });
    }
    _install(pack) {
        return this._installPack(pack).then(packDetails => {
            if (packDetails) {
                return this._installDependencies(packDetails);
            }
            return Promise.resolve();
        });
    }
    
    _installDependencies(packDetails) {
        return this._installAtTypes(packDetails.packageJSON).then(() => this._installDependentPackTypes(packDetails.extractPath));
    }
    _installAtTypes(packageJSON) {
        var dependencies = packageJSON["dependencies"];
        var installPromises = [];
        for (let key in dependencies) {
            let version = dependencies[key];
            let keyVersion = key + '@' + version;
            if (key.startsWith('@types')) {
                installPromises.push(npm.installAsync('--save ' + keyVersion).then(() => this._atTypes.push(key)));
            } else {
                this._install(key);
            }

        }
        return Promise.all(installPromises);
    }
    _installDependentPackTypes(extractPath) {
        var dependentStore = new storeClass(extractPath);
        return dependentStore.getPackTypes().then(packTypes => {
            
            var installPackTypePromises = packTypes.map(packType => {
                return this._install(packType);
            });
            return Promise.all(installPackTypePromises);
        });
    }
    _installPack(pack) {
        var _extractPath;
        if (this._installedPacks.indexOf(pack) === -1) {
            return this._packAndExtract(pack)
                .then(extractPath => {
                    this._installedPacks.push(pack);
                    _extractPath = extractPath;
                    return this._moveToAtTypes(extractPath)
                })
                .then(packDetails => {
                    this._packFolders = this._packFolders.concat(packDetails.folders);
                    return {
                        packageJSON: packDetails.packageJSON, extractPath: _extractPath
                    };
                });
        }
        return Promise.resolve();
        
    }
    
    _packAndExtract(packArgs) {
        return tmpdirAsync().then(pathAndCallback => {
            var tmpPath = pathAndCallback.path + path.sep;
            return packandextractAsync('"' + packArgs + '"', tmpPath, (filePath) => {
                if (filePath == 'package.json' || path.basename(filePath) != filePath) {
                    return true;
                }
            }).then(() => tmpPath);
        });
    }
    _moveToAtTypes(tmpPath) {
        var jsonPath = path.join(tmpPath, 'package.json');
        return Promise.all([getDirectoriesAsync(tmpPath), fsp.readJson(jsonPath)])
            .then(dirsAndPackage => {
                var dirs = dirsAndPackage[0];
                var packageJSON = dirsAndPackage[1];
                var movePromises = dirs.map(dirName => {
                    var src = path.join(tmpPath, dirName);
                    var dest = path.join(this.destinationPath(typesPath),dirName);
                    return fsp.move(src, dest);
                });
                return Promise.all(movePromises)
                    .then(() => ({ folders: dirs, packageJSON: packageJSON }));
            });
    }
    _saveStore() {
        return this._store.save(this.options.pack, this._packFolders, this._atTypes)
    }
    _logOk(message) {
        console.log(chalk.green(message));
    }
    _logError(errorMessage) {
        console.log(chalk.red(errorMessage))
    }
    installing() { 
        debugger;
        this._store = new storeClass(this.destinationRoot());
        if (this.options.delete) {
            this._uninstall().then(() => {
                this._logOk('uninstalled');
            }).catch((err) => {
                this._logError(err.message);
            });
        } else {
            return this._install(this.options.pack).then(() => this._saveStore()).then(() => {
                this._logOk('installed');
            }).catch(err => {
                this._logError(err.message);
            });
        }
    }
};
