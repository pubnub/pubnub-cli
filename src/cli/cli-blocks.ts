#!/usr/bin/env node

import * as program from "commander";

import API from "../components/api";
import Blocks from "../components/blocks";
import {validateBlockDirectory} from "../components/files";

const { version } = require("../../package.json");

const handleListBlocks = ({keyId}: any) => {
    console.log("Performing getBlocks");
    API.getBlocks({ keyId }).then((response) => {
        console.log(response);
    });
};

const handleStartBlock = ({keyId, blockId}: any) => {
    console.log("Performing handleStartBlock");
    API.startBlock({keyId, blockId}).then((response) => {
        console.log(response);
    });
};

const handleStopBlock = ({keyId, blockId}: any) => {
    console.log("Performing handleStopBlock");
    API.stopBlock({keyId, blockId}).then((response) => {
        console.log(response);
    });
};

const handleCreateBlock = ({keyId, dir}: any) => {
    console.log("Performing handleCreateBlock");
    dir = (dir === undefined) ? "./" : dir;
    validateBlockDirectory(dir); // TODO: split this validator for directory and for valid block directory
    API.createBlock({ ...Blocks.readBlockFile(dir), key_id: keyId }).then((response) => {
        console.log(response);
    }).catch((error) => {
        console.log("Error!", error)
    });
};

const handleUpdateBlock = () => {
    console.log("Performing handleUpdateBlock");
};

program
    .version(version);

program
    .command("list")
    .option("-k, --key-id <keyId>", "Subscribe keyId ID.", parseInt)
    .description("lists blocks.")
    .action(handleListBlocks);

program
    .command("start")
    .option("-k, --key-id <keyId>", "Subscribe keyId ID.", parseInt)
    .option("-b, --block-id <blockId>", "Block ID.", parseInt)
    .description("starts block.")
    .action(handleStartBlock);

program
    .command("stop")
    .option("-k, --key-id <keyId>", "Subscribe keyId ID.", parseInt)
    .option("-b, --block-id <blockId>", "Block ID.", parseInt)
    .description("stops block.")
    .action(handleStopBlock);

program
    .command("create")
    .option("-k, --key-id <keyId>", "Subscribe keyId ID.", parseInt)
    .option("-d, --dir <blockPath>", "Block path.")
    .description("create block.")
    .action(handleCreateBlock);

program
    .command("update")
    .description("update block.")
    .action(handleUpdateBlock);

program
    .parse(process.argv);

if (!process.argv.slice(2).length) {
   program.outputHelp();
}
