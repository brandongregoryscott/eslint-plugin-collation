#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { Project } from "ts-morph";
import { alphabetizeInterfaces } from "./rules/alphabetize-interfaces";
import { compact, flatMap, isEmpty } from "lodash";
import { alphabetizeJsxProps } from "./rules/alphabetize-jsx-props";
import { printProject } from "./cli/print-project";
import { fuzzyFindFile } from "./cli/fuzzy-find-file";
import { Logger } from "./cli/logger";
import chalk from "chalk";

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
        files: filesPaths,
        printProject: shouldPrintProject,
    } = program.opts();
    if (shouldPrintProject) {
        printProject(project);
        return;
    }

    if (filesPaths != null && !Array.isArray(filesPaths)) {
        Logger.warn(
            `${chalk.bold(
                "--files"
            )} specified without any file names or paths.`
        );
        process.exit(0);
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
            Logger.warn(
                "Some of the specified files could not be found in the project."
            ).json(missingFiles);
        }

        files.forEach((file) => {
            alphabetizeInterfaces(file);
            alphabetizeJsxProps(file);
        });
        await project.save();
        process.exit(0);
    }

    if (isEmpty(filePath)) {
        const files = project.getSourceFiles();
        files.forEach((file) => {
            alphabetizeInterfaces(file);
            alphabetizeJsxProps(file);
        });

        await project.save();
        process.exit(0);
    }

    const file = project.getSourceFile(filePath);
    if (file == null) {
        const similarResults = fuzzyFindFile(filePath, project);
        const notFoundError = `File ${filePath} not found in project.`;
        if (isEmpty(similarResults)) {
            Logger.error(notFoundError);
            process.exit(1);
        }

        Logger.error(`${notFoundError} Did you mean one of these?`).json(
            similarResults
        );
        process.exit(1);
    }

    if (file != null) {
        alphabetizeInterfaces(file);
        alphabetizeJsxProps(file);
    }

    await project.save();
};

main();
