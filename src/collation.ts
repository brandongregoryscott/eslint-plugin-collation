#!/usr/bin/env node
import { Command } from "commander";
import { version, description } from "../package.json";
import { Project } from "ts-morph";
import { Context } from "./models/context";
import { CliOptions } from "./interfaces/cli-options";
import { printProject } from "./cli/handlers/print-project";
import { runByFile } from "./cli/handlers/run-by-file";
import { runByFiles } from "./cli/handlers/run-by-files";
import { alphabetizeInterfaces } from "./rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "./rules/alphabetize-jsx-props";
import { flatten } from "lodash";
import { printRuleResults } from "./utils/print-rule-results";

const main = async () => {
    const program = new Command();
    program
        .description(description)
        .version(version)
        .option("-d, --dry", "Run without saving changes")
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
        .option("-s, --silent", "Silence all logs in output")
        .option("-v, --verbose", "Include debug-level logs in output")
        .parse();

    const project = new Project({ tsConfigFilePath: "tsconfig.json" });
    const {
        file: filePath,
        files: filePaths,
        printProject: shouldPrintProject,
    } = program.opts<CliOptions>();

    Context.initialize({
        project,
        cliOptions: program.opts<CliOptions>(),
    });

    if (shouldPrintProject) {
        printProject(project);
        return;
    }

    if (filePaths != null) {
        await runByFiles();
    }

    if (filePath != null) {
        await runByFile();
    }

    // Default case: run for all files
    const files = project.getSourceFiles();
    const results = await Promise.all(
        flatten(
            files.map((file) => [
                alphabetizeInterfaces(file),
                alphabetizeJsxProps(file),
            ])
        )
    );

    printRuleResults(results);

    await Context.saveIfNotDryRun();
    process.exit(0);
};

main();
