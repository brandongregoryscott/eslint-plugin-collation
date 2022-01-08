#!/usr/bin/env node
import { Command } from "commander";
import { Project } from "ts-morph";
import { scaffoldNewRule } from "./scaffold-new-rule";

interface InternalCodegenCliOptions {
    name?: string;
}

const main = async () => {
    const program = new Command();
    program
        .name("internal-codegen")
        .description("Internal codegen utility")
        .option("-n, --name <name>", "Name of the new rule to scaffold out")
        .parse();

    const project = new Project({ tsConfigFilePath: "tsconfig.json" });
    const { name } = program.opts<InternalCodegenCliOptions>();

    if (name != null) {
        await scaffoldNewRule(project, name);
        process.exit(0);
    }

    program.outputHelp();
};

main();
