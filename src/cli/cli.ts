#!/usr/bin/env node

import * as program from "commander";
const { version } = require("../../package.json");

program
    .version(version)
    .command("init [operations]", "perform intialization operations")
    .command("session [operations]", "perform operations related to sessions")
    //TODO: .command("validate [operations]", "confirm that block is valid")
    .command("blocks [operations]", "perform operations related to blocks")
    .command("apps [operations]", "perform operations related to blocks")

program
    .parse(process.argv);
