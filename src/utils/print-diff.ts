import chalk from "chalk";
import { Change } from "diff";
import { Logger } from "utils/logger";

const printDiff = (changes: Change[]) => {
    changes.forEach((change) => {
        const { added = false, removed = false, value } = change;
        // Strip off additional new line to tighten up output
        const sanitizedValue = value.endsWith("\n")
            ? value.substring(0, value.length - 2)
            : value;

        if (added) {
            Logger.rawLine(chalk.bgGreen(value));
            return;
        }

        if (removed) {
            Logger.rawLine(chalk.bgRed(value));
            return;
        }

        Logger.rawLine(sanitizedValue);
    });
};

export { printDiff };
