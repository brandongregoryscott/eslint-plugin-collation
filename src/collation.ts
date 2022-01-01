#!/usr/bin/env node
import { Command } from "commander";
import { version, description } from "../package.json";
import { Project } from "ts-morph";
import { Context } from "./models/context";
import { CliOptions } from "./interfaces/cli-options";
import { printProject } from "./cli/handlers/print-project";
import { runByFiles } from "./cli/handlers/run-by-files";
import { ruleRunner } from "./utils/rule-runner";
import "source-map-support/register";
import { runAll } from "./cli/handlers/run-all";

const main = async () => {
    const program = new Command();
    program
        .description(description)
        .version(version)
        .option("-a, --all", "Run for all files in project")
        .option("-d, --dry", "Run without saving changes")
        .option(
            "-f, --files [fileNamesOrPaths...]",
            "Run on specific file(s) (e.g. --files button.tsx form.tsx)"
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
        all,
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

    if (all === true) {
        await runAll();
    }

    program.outputHelp();
};

main();
