#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { Project } from "ts-morph";
import { printProject } from "cli/handlers/print-project";
import { runByFiles } from "cli/handlers/run-by-files";
import { runByFile } from "cli/handlers/run-by-file";
import { alphabetizeInterfaces } from "rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "rules/alphabetize-jsx-props";

interface Options {
    file?: string;
    files?: string[];
    printProject?: boolean;
}

const main = async () => {
    const program = new Command();
    program
        .version(version)
        .option(
            "-f, --file <fileNameOrPath>",
            "Run on specific file (e.g. --file button.tsx)"
        )
        .option(
            "-F, --files [fileNamesOrPaths...]",
            "Run on specific files (e.g. --files button.tsx form.tsx)"
        )
        .option(
            "-p, --print-project",
            "Output debugging information about detected TypeScript project"
        )
        .parse();

    const project = new Project({ tsConfigFilePath: "tsconfig.json" });

    const {
        file: filePath,
        files: filePaths,
        printProject: shouldPrintProject,
    } = program.opts<Options>();

    if (shouldPrintProject) {
        printProject(project);
        return;
    }

    if (filePaths != null) {
        await runByFiles(project, filePaths);
    }

    if (filePath != null) {
        await runByFile(project, filePath);
    }

    // Default case: run for all files
    const files = project.getSourceFiles();
    files.forEach((file) => {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    });

    await project.save();
    process.exit(0);
};

main();
