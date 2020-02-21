#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const shell = require("shelljs");

const foo = shell.pwd().toString();

shell.exec(`${foo}/node_modules/node-pre-gyp/bin/node-pre-gyp -h`);

throw new Error("fast fail");
