import chalk from "chalk";
import { isEmpty } from "lodash";
import { RuleResult } from "../interfaces/rule-result";
import { Logger } from "./logger";

const printRuleResults = (ruleResults: RuleResult[]) =>
    ruleResults.forEach(printRuleResult);

const printRuleResult = (ruleResult: RuleResult) => {
    const { errors, file } = ruleResult;
    if (isEmpty(errors)) {
        return;
    }

    const rule = chalk.magenta(errors[0].rule);
    errors.forEach((error) => {
        const fileName = chalk.bold(file.getBaseName());
        const { lineNumber, message } = error;
        const location = chalk.bold(`${fileName}:${lineNumber}`);

        let baseMessage = `${rule} ${location} ${message}`;
        if (!isEmpty(error.hint)) {
            baseMessage = `${baseMessage} ${chalk.gray(`(${error.hint})`)}`;
        }

        Logger.error(baseMessage);
    });
};

export { printRuleResults };
