#!/usr/bin/env node

import * as program from "commander";
import API from "../components/api";
const { version } = require("../../package.json");

const handleListApps = () => {
    console.log("Performing handleListApps");
    API.getApps({}).then((response) => {
        console.log(response);
    });
};

program
    .version(version);

program
    .command("list")
    .description("lists apps.")
    .action(handleListApps);

program
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}