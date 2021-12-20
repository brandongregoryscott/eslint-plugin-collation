#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { Project } from "ts-morph";
import { alphabetizeInterfaces } from "./rules/alphabetize-interfaces";
import { compact, flatMap, isEmpty } from "lodash";
import { alphabetizeJsxProps } from "./rules/alphabetize-jsx-props";
import { printProject } from "./cli/print-project";
import { fuzzyFindFile } from "./cli/fuzzy-find-file";

const main = async () => {
    const program = new Command();
    program
        .version(version)
        .option(
            "-f, --file <fileNameOrPath>",
            "Run on specific file (e.g. --file button.tsx)"
        )
        .option(
            "-F, --files <fileNamesOrPaths...>",
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
        files: filesPaths,
        printProject: shouldPrintProject,
    } = program.opts();
    if (shouldPrintProject) {
        printProject(project);
        return;
    }

    if (!isEmpty(filesPaths)) {
        const files = compact(
            flatMap(filesPaths, (filePath) => project.getSourceFile(filePath))
        );

        if (files.length !== filesPaths.length) {
            const missingFiles = compact(
                flatMap(filesPaths, (filePath) =>
                    project.getSourceFile(filePath) != null
                        ? undefined
                        : filePath
                )
            );
            console.log(
                `Warning: Some of the specified files could not be found in the project.`
            );
            console.log(JSON.stringify(missingFiles, undefined, 4));
        }

        files.forEach((file) => {
            alphabetizeInterfaces(file);
            alphabetizeJsxProps(file);
        });
        return;
    }

    if (isEmpty(filePath)) {
        const files = project.getSourceFiles();
        files.forEach((file) => {
            alphabetizeInterfaces(file);
            alphabetizeJsxProps(file);
        });
        return;
    }

    const file = project.getSourceFile(filePath);
    if (file == null) {
        const similarResults = fuzzyFindFile(filePath, project);
        const notFoundError = `File ${filePath} not found in project.`;
        if (isEmpty(similarResults)) {
            console.log(notFoundError);
            process.exit(1);
        }

        console.log(`${notFoundError} Did you mean one of these?`);
        console.log(JSON.stringify(similarResults, undefined, 4));
        process.exit(1);
    }

    if (file != null) {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    }

    await project.save();
};

main();
