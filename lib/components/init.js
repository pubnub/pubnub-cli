"use strict";
const fs = require("fs");
const path = require("path");
const colors = require("colors");
const lodash_1 = require("lodash");
const inquirer_1 = require("inquirer");
const utils_1 = require("../utils");
const VERSION = 1;
class InitComponent {
    constructor({ logger, networking, interactive = false }) {
        this.logger = logger;
        this.networking = networking;
        this.interactive = interactive;
        this.blockManifestFile = 'block.json';
    }
    createBlock({ folderPath }) {
        if (!this.interactive) {
            this.logger.error('#createBlock not supported for non-interactive mode');
            return;
        }
        let existingManifest = null;
        try {
            existingManifest = fs.readFileSync(path.join(folderPath, this.blockManifestFile), 'utf-8');
        }
        catch (e) {
        }
        if (existingManifest !== null) {
            this.logger.error(colors.red(this.blockManifestFile + 'already exists. aborting initalization'));
            return;
        }
        const inputParams = [
            {
                field: null,
                name: 'name',
                message: 'Please enter the BLOCK name',
                type: 'input',
                default: lodash_1.default.kebabCase(path.basename(folderPath))
            },
            {
                field: null,
                name: 'description',
                message: 'Please enter the BLOCK description',
                type: 'input'
            },
            {
                field: null,
                name: 'license',
                message: 'Please enter the license type',
                type: 'input',
                default: 'ISC'
            },
            {
                field: null,
                name: 'version',
                message: 'Please enter the inital version',
                type: 'input',
                default: '1.0.0'
            }
        ];
        utils_1.abstractedValidator(inputParams, this.interactive).then((fields) => {
            this.logger.info('About to create the following ' + this.blockManifestFile + ' file \n' + JSON.stringify(fields, null, '\t'));
            inquirer_1.default.prompt({ type: 'boolean', name: 'okayToWrite', default: true, message: 'Good to write to file system?' }).then((result) => {
                if (result.okayToWrite) {
                    fields.dependencies = {};
                    fields.version = VERSION;
                    fs.writeFileSync(path.join(folderPath, this.blockManifestFile), JSON.stringify(fields, null, 4));
                    this.logger.info(this.blockManifestFile + 'file created at: ' + path.join(folderPath, this.blockManifestFile));
                }
            });
        });
    }
    createEventHandler({ folderPath }) {
        const srcFolder = path.join(folderPath, 'src');
        const templateFolder = path.join(__dirname, '../../templates');
        const jsTemplate = fs.readFileSync(path.join(templateFolder, 'eh.js'), 'utf8');
        if (!this.interactive) {
            this.logger.error('#createEventHandler not supported for non-interactive mode');
            return;
        }
        try {
            fs.statSync(srcFolder);
        }
        catch (e) {
            fs.mkdirSync(srcFolder);
        }
        const inputParams = [
            {
                field: null,
                name: 'name',
                message: 'Please enter the Event Handler name',
                type: 'input'
            },
            {
                field: null,
                name: 'type',
                message: 'Please choose the event handler type',
                type: 'list',
                choices: ['Before Publish', 'After Publish', 'After Presence']
            }
        ];
        utils_1.abstractedValidator(inputParams, this.interactive).then((fields) => {
            const handlerJSON = { name: lodash_1.default.kebabCase(fields.name), type: lodash_1.default.kebabCase(fields.type) };
            fs.writeFileSync(path.join(srcFolder, lodash_1.default.lowerCase(fields.name) + '.json'), JSON.stringify(handlerJSON, null, 4));
            fs.writeFileSync(path.join(srcFolder, lodash_1.default.lowerCase(fields.name) + '.js'), jsTemplate);
            this.logger.info('Created new event handler.');
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InitComponent;
