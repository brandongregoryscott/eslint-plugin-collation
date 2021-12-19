#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { Project } from "ts-morph";
import shell from "shelljs";
import { alphabetizeInterfaces } from "./rules/alphabetize-interfaces";
import { isEmpty } from "lodash";
import { alphabetizeJsxProps } from "./rules/alphabetize-jsx-props";

const main = async () => {
    const program = new Command();
    program
        .version(version)
        .option("-f, --file <fileNameOrPath>", "Run on specific file")
        .parse();

    const project = new Project({ tsConfigFilePath: "tsconfig.json" });

    const { file: filePath } = program.opts();
    if (isEmpty(filePath)) {
        const files = project.getSourceFiles();
        files.forEach((file) => {
            alphabetizeInterfaces(file);
            alphabetizeJsxProps(file);
        });
    }

    const file = project.getSourceFile(filePath);
    if (file == null) {
        shell.echo(`File ${filePath} not found in project.`);
        shell.exit(1);
    }

    if (file != null) {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    }

    await project.save();
};

main();
