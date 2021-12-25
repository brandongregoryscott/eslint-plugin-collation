import chalk from "chalk";
import { isEmpty } from "lodash";
import { Context } from "../models/context";
import { RuleViolation } from "../models/rule-violation";

interface RuleMessageOptions
    extends Pick<RuleViolation, "file" | "message" | "rule">,
        Partial<Pick<RuleViolation, "lineNumber">> {}

const prefix = chalk.cyanBright("[collation]");

class Logger {
    public debug = (message: string, ...values: any[]): Logger => {
        if (!Context.isVerbose()) {
            return this;
        }

        return this.log(
            `${prefix} ${chalk.gray("DEBUG")} ${message}`,
            ...values
        );
    };

    public divider = (): Logger => {
        return this.log(`${prefix} ${"-".repeat(68)}`);
    };

    public error = (message: string, ...values: any[]): Logger => {
        return this.log(
            `${prefix} ${chalk.redBright("ERROR")} ${message}`,
            ...values
        );
    };

    public info = (message: string, ...values: any[]): Logger => {
        return this.log(`${prefix} ${message}`, ...values);
    };

    public json = (value: any): Logger => {
        return this.log(JSON.stringify(value, undefined, 4));
    };

    public newLine = (): Logger => {
        return this.log("");
    };

    public rawLine = (message: string, ...values: any[]): Logger => {
        return this.log(message, ...values);
    };

    public ruleDebug = (
        options: RuleMessageOptions,
        ...values: any[]
    ): Logger => {
        return this.debug(this.getRuleMessage(options), ...values);
    };

    public ruleViolation = (violation: RuleViolation): Logger => {
        let baseMessage = this.getRuleMessage(violation);
        if (!isEmpty(violation.hint)) {
            baseMessage = `${baseMessage} ${chalk.gray(`(${violation.hint})`)}`;
        }

        return this.error(baseMessage);
    };

    public warn = (message: string, ...values: any[]): Logger => {
        return this.log(
            `${chalk.yellowBright(`${prefix} WARN`)} ${message}`,
            ...values
        );
    };

    private getRuleMessage = (options: RuleMessageOptions): string => {
        const { file, lineNumber, message } = options;
        const rule = chalk.magenta(options.rule);
        const fileName = chalk.bold(file.getBaseName());
        let location = chalk.bold(`${fileName}`);

        if (lineNumber != null) {
            location += chalk.bold(`:${lineNumber}`);
        }

        return `${rule} ${location} ${message}`;
    };

    private log = (message: string, ...values: any[]): Logger => {
        if (Context.isSilent()) {
            return this;
        }

        console.log(message, ...values);
        return this;
    };
}

const Singleton = new Logger();

export { Singleton as Logger };
