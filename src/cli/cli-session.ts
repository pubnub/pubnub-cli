#!/usr/bin/env node

import * as program from "commander";
import Session from "../components/session";
const { version } = require("../../package.json");

const handleCreate = (email: string, password: string) => {
    console.log(`create called with email "${email}" and password "${password}"`);
    Session.create({ email, password })
};

const handleDelete = () => {
    console.log("delete called");
};

const handleCheck = () => {
    console.log("check called");
};

program
    .version(version);

program
    .command("create <email> <password>")
    .description("create session: email & password is optional and can be supplied in runtime.")
    .action(handleCreate);

program
    .command("delete")
    .description("deletes stuff")
    .action(handleDelete);

program
    .command("check")
    .description("checks stuff")
    .action(handleCheck);

program
    .parse(process.argv);
