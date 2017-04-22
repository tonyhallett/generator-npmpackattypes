const fsp = require('fs-promise');
const path = require('path');

module.exports = class {
    constructor(destinationPath) {
        this._packageJSONPath = destinationPath + path.sep + 'package.json';
    }

    retrieveAndRemove(pack) {
        return fsp.readJSON(this._packageJSONPath).then(packageJSON => {
            var packTypes = packageJSON.packTypes;

            if (packTypes) {
                var thisPack = packTypes[pack];
                if (thisPack) {
                    delete packTypes[pack];
                    return fsp.writeJson(this._packageJSONPath, packageJSON).then(()=>thisPack);
                }
            }
            return Promise.resolve();
        });
    }
    save(pack,packFolders,atTypes) {
        debugger;
        return fsp.readJson(this._packageJSONPath).then(packageJSON => {
            var packTypes = packageJSON.packTypes;
            if (!packTypes) {
                packTypes = {};
                packageJSON.packTypes = packTypes;
            }
            var thisPack = packTypes[pack];
            if (!thisPack) {
                thisPack = {};
                packTypes[pack] = thisPack;
            }
            thisPack.packFolders = packFolders;
            thisPack.atTypes = atTypes;
            return packageJSON;
        })
            .then(packageJSON => fsp.writeJson(this._packageJSONPath, packageJSON));
    }
    getPackTypes() {
        return fsp.readJson(this._packageJSONPath).then(packageJSON => {
            var packTypes = packageJSON.packTypes;
            if (!packTypes) {
                packTypes = {};
            }
            var packTypesArray = [];
            for (var packType in packTypes) {
                //object has own.........
                packTypesArray.push(packType);
            }
            return packTypesArray;
        })
    }
}