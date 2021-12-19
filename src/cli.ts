#!/usr/bin/env node
import { Command } from "commander";
import { isEmpty } from "lodash";
import { version } from "../package.json";

const program = new Command();
program.version(version).parse();

if (isEmpty(program.opts())) {
  program.help();
}
