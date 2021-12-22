import chalk from "chalk";
import { Project } from "ts-morph";
import { CliOptions } from "../interfaces/cli-options";
import { Logger } from "../utils/logger";

interface ContextOptions {
    cliOptions: CliOptions;
    project: Project;
}

class Context {
    public readonly cliOptions: CliOptions;
    public readonly project: Project;

    public constructor(options: ContextOptions) {
        const { cliOptions, project } = options;
        this.cliOptions = cliOptions;
        this.project = project;
    }

    public async saveIfNotDryRun(): Promise<void> {
        const { dry = false } = this.cliOptions;
        if (dry) {
            Logger.info(
                `Continuing without saving since ${chalk.bold(
                    "--dry"
                )} was specified.`
            );
            return;
        }

        await this.project.save();
    }
}

export type { ContextOptions };
export { Context };