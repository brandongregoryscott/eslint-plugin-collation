#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";

const program = new Command();
program.version(version).parse();

if (Object.keys(program.opts()).length < 1) {
  program.help();
}
