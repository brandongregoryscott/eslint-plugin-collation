import chalk from "chalk";
import { Project } from "ts-morph";
import { CliOptions } from "../interfaces/cli-options";
import { Logger } from "../utils/logger";

interface ContextOptions {
    cliOptions: CliOptions;
    project: Project;
}

class Context {
    /* @ts-ignore */
    public cliOptions: CliOptions;
    /* @ts-ignore We're manually handling initialization and don't need TS to hold our hand */
    public project: Project;

    private initialized: boolean = false;

    public initialize(context: ContextOptions): Context {
        const { cliOptions, project } = context;
        this.cliOptions = cliOptions;
        this.project = project;
        this.initialized = true;

        return this;
    }

    public isSilent(): boolean {
        const { silent = false } = this.cliOptions;
        return silent;
    }

    public isVerbose(): boolean {
        const { verbose = false } = this.cliOptions;
        return verbose;
    }

    public async saveIfNotDryRun(): Promise<void> {
        this.throwIfUninitialized();

        const { dry = false } = this.cliOptions;
        if (dry) {
            Logger.debug(
                `Continuing without saving since ${chalk.bold(
                    "--dry"
                )} was specified.`
            );
            return;
        }

        await this.project.save();
    }

    private throwIfUninitialized(): Context | never {
        if (this.initialized) {
            return this;
        }

        throw new Error(
            `Context has not yet been initialized - ensure you are calling Context.initialize({ project, cliOptions }) first.`
        );
    }
}

const Singleton = new Context();

export type { ContextOptions };
export { Singleton as Context };
