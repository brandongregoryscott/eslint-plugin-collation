import { SourceFile } from "ts-morph";
import { NamedRuleFunction, RuleFunction } from "../types/rule-function";
import { Logger } from "./logger";
import chalk from "chalk";

/**
 * Wrapper for automatically applying retry functionality around a `RuleFunction`
 * which may be desirable to perform a 2nd or 3rd pass on a file, such as when nodes are forgotten
 */
const withRetry = (rule: RuleFunction) => async (file: SourceFile) => {
    const ruleName = chalk.magenta((rule as NamedRuleFunction).__name);
    const fileName = chalk.bold(file.getBaseName());
    for (let i = 0; i < 3; i++) {
        try {
            return await rule(file);
        } catch (error) {
            Logger.debug(
                `Encountered error running ${ruleName} with file ${fileName} (attempt ${
                    i + 1
                })`,
                error
            );
            if (!isForgottenNodeError(error)) {
                throw error;
            }
        }
    }

    throw new Error(
        `Attempted to retry rule ${ruleName} on ${fileName} too many times.`
    );
};

const isForgottenNodeError = (error: any): error is Error =>
    error instanceof Error && error.message.includes("removed or forgotten");

export { withRetry };
