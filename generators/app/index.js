'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const packandextract = require('packandextract');
const path = require('path');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument("pack", { required: true });
    }
  
  _packAndExtractTypescriptDefnFilesToAtTypes(packArg) {
      packandextract(packArg, "node_modules/@types/", (filePath) => {
          if (path.basename(filePath) != filePath) {
              return true;
          }
          return false;
      }, true);
  }

  writing() {
      this._packAndExtractTypescriptDefnFilesToAtTypes(this.options.pack);
  }

};
