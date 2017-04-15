'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const packandextract = require('packandextract');
const path = require('path');
const del = require('delete');
const merge = require('deepmerge');
const fsp = require('fs-promise');

var packTypesRelativePath = 'node_modules/generator-npmpackattypes/packTypes.json'
var typesPath = 'node_modules/@types/';
var packandextractAsync = function (packArg, relativeDirectory, filter, deleteGzippedTarball) {
    return new Promise((resolve, reject) => {
        packandextract(packArg, relativeDirectory, () => {
            //at the moment packandextract is swallowing all errors
            resolve();
        },filter, deleteGzippedTarball)
    });
}

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.argument("pack", { required: true });
        this.option("delete", { alias: 'd' })
    }
    _uninstall() {
        return this._getPackTypes()
            .then(json => {
                var packageFolderNames = json[this.options.pack];
                var deleteFolderPromises = packageFolderNames.map(n => {
                    var deletePath = this.destinationPath(typesPath + n);
                    var deleteFolderPromise = fsp.remove(deletePath);
                    return deleteFolderPromise;
                });
                return Promise.all(deleteFolderPromises)
                    .then(() => {
                    delete json[this.options.pack];
                    return this._setPackTypes(json);
                }).catch(err => {
                    console.log(err);
                })
            })
     
    }
    _getPackTypesPath() {
        return  this.destinationPath(packTypesRelativePath);
    }
    _getPackTypes() {
        var path = this._getPackTypesPath();
        return fsp.ensureFile(path)
            .then(f => {
                //f is undefined even when it already exists.....?
                return fsp.readJson(path);
            })
            .catch(err => {
                return {};
            });
    }
    _setPackTypes(json) {
        return fsp.writeJSON(this._getPackTypesPath(),json);
    }
    _setPackTypesForPackage(rootFolderNames) {
        return this._getPackTypes()
            .then(json => {
                json[this.options.pack] = rootFolderNames;
                return this._setPackTypes(json);
            });
    }
    _getDirRootDetails(dirname) {
        var dirs = dirname.split("/");
        if (dirs.length == 1) {
            return { name: dirname, root: true };
        }
        return { root: false };
        
    }
    _addToArrayIfUnique(arr, item) {
        var unique=true;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) {
                unique = false;
                break;
            }
        }
        if (unique)
            arr.push(item);
    }
    _packAndExtract() {
        var rootFolderNames = [];
        var self = this;
        function manageRootFolders(dirname) {
            var dirRootDetails = self._getDirRootDetails(dirname);
            if (dirRootDetails.root) {
                self._addToArrayIfUnique(rootFolderNames, dirRootDetails.name);
            }
        }
        
        return packandextractAsync('"' + this.options.pack + '"', typesPath, (filePath) => {
            if (path.basename(filePath) != filePath) {
                manageRootFolders(path.dirname(filePath));
                return true;
            }
            })
        .then(() => this._setPackTypesForPackage(rootFolderNames));
  }

    installing() { 
        if (this.options.delete) {
            this._uninstall();
        } else {
            return this._packAndExtract();
        }
    }
};
