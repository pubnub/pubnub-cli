import fs from 'fs';
import path from 'path';

import colors from 'colors/safe';
import _ from 'lodash';
import inquirer from 'inquirer';

import { abstractedValidator } from '../utils';

const VERSION = 1;

export default class {

  constructor({ logger, networking, interactive = false }) {
    this.logger = logger;
    this.networking = networking;
    this.interactive = interactive;
    this.blockManifestFile = 'block.json';
  }

  createBlock({ folderPath }) {
    // disable this method for non interactive use.
    if (!this.interactive) {
      this.logger.error('#createBlock not supported for non-interactive mode');
      return;
    }

    let existingManifest = null;

    try {
      existingManifest = fs.readFileSync(path.join(folderPath, this.blockManifestFile), 'utf-8');
    } catch (e) {
      // silence
    }

    if (existingManifest !== null) {
      this.logger.error(colors.red(this.blockManifestFile + 'already exists. aborting initalization'));
      return;
    }

    const inputParams = [
      {
        field: null,
        name: 'name',
        question: 'Please enter the BLOCK name',
        type: 'input',
        default: _.kebabCase(path.basename(folderPath))
      },
      {
        field: null,
        name: 'description',
        question: 'Please enter the BLOCK description',
        type: 'input'
      },
      {
        field: null,
        name: 'license',
        question: 'Please enter the license type',
        type: 'input',
        default: 'ISC'
      },
      {
        field: null,
        name: 'version',
        question: 'Please enter the inital version',
        type: 'input',
        default: '1.0.0'
      }
    ];

    abstractedValidator(inputParams, this.interactive).then((fields) => {
      this.logger.info('About to create the following ' + this.blockManifestFile + ' file \n' + JSON.stringify(fields, null, '\t'));

      inquirer.prompt({ type: 'boolean', name: 'okayToWrite', default: true, message: 'Good to write to file system?' }).then((result) => {
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

    // disable this method for non interactive use.
    if (!this.interactive) {
      this.logger.error('#createEventHandler not supported for non-interactive mode');
      return;
    }

    // check if src folder exists and create it if it does not.
    try {
      fs.statSync(srcFolder);
    } catch (e) {
      fs.mkdirSync(srcFolder);
    }

    const inputParams = [
      {
        field: null,
        name: 'name',
        question: 'Please enter the Event Handler name',
        type: 'input'
      },
      {
        field: null,
        name: 'type',
        question: 'Please choose the event handler type',
        type: 'list',
        choices: ['Before Publish', 'After Publish', 'After Presence']
      }
    ];

    abstractedValidator(inputParams, this.interactive).then((fields) => {
      const handlerJSON = { name: _.kebabCase(fields.name), type: _.kebabCase(fields.type) };
      fs.writeFileSync(path.join(srcFolder, _.lowerCase(fields.name) + '.json'), JSON.stringify(handlerJSON, null, 4));
      fs.writeFileSync(path.join(srcFolder, _.lowerCase(fields.name) + '.js'), jsTemplate);
      this.logger.info('Created new event handler.');
    });
  }

}
