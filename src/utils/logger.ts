import chalk from "chalk";

const prefix = chalk.cyanBright("[collation]");

class Logger {
    public debug(message: string, ...values: any[]): Logger {
        return this.log(
            `${prefix} ${chalk.gray("DEBUG")} ${message}`,
            ...values
        );
    }

    public divider(): Logger {
        return this.log(`${prefix} ${"-".repeat(68)}`);
    }

    public error(message: string, ...values: any[]): Logger {
        return this.log(
            `${prefix} ${chalk.redBright("ERROR")} ${message}`,
            ...values
        );
    }

    public info(message: string, ...values: any[]): Logger {
        return this.log(`${prefix} ${message}`, ...values);
    }

    public json(value: any): Logger {
        return this.log(JSON.stringify(value, undefined, 4));
    }

    public newLine(): Logger {
        return this.log("");
    }

    public warn(message: string, ...values: any[]): Logger {
        return this.log(
            `${chalk.yellowBright(`${prefix} WARN`)} ${message}`,
            ...values
        );
    }

    private log(message: string, ...values: any[]): Logger {
        console.log(message, ...values);
        return this;
    }
}

const Singleton = new Logger();

export { Singleton as Logger };
