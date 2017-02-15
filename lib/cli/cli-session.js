#! /usr/bin/env node
const program = require("commander");
const EntryPoint = require("../index.js");
const packageInfo = require("../../package.json");
const entryPoint = new EntryPoint({ isCLI: true });
program
    .version(packageInfo.version)
    .option("create [email] [password]", "create session: email & password is optional and can be supplied in runtime.")
    .option("delete", "delete session: delete the stored credentials if they exist.")
    .option("check", "check session: check if session is alive")
    .parse(process.argv);
const operation = program.args[2];
if (!operation)
    process.exit(1);
if (operation === "create") {
    const email = program.rawArgs[3];
    const password = program.rawArgs[4];
    entryPoint.session.create({ email, password });
}
else if (operation === "delete") {
    entryPoint.session.delete();
}
else if (operation === "check") {
    entryPoint.session.check();
}
else {
    entryPoint.logger.error("operation not recognized");
}
