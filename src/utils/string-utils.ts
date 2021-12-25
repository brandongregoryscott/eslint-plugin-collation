import chalk from "chalk";
import { isEmpty } from "lodash";
import { RuleViolation } from "../models/rule-violation";

export interface PartialRuleViolation
    extends Pick<RuleViolation, "file" | "message" | "rule">,
        Partial<Pick<RuleViolation, "lineNumber">> {}

const formatPartialRuleViolation = (
    partialViolation: PartialRuleViolation
): string => {
    const { file, lineNumber, message } = partialViolation;
    const rule = chalk.magenta(partialViolation.rule);
    const fileName = chalk.bold(file.getBaseName());
    let location = chalk.bold(`${fileName}`);

    if (lineNumber != null) {
        location += chalk.bold(`:${lineNumber}`);
    }

    return `${rule} ${location} ${message}`;
};

const formatRuleViolation = (violation: RuleViolation): string => {
    let baseMessage = formatPartialRuleViolation(violation);
    if (!isEmpty(violation.hint)) {
        baseMessage = `${baseMessage} ${chalk.gray(`(${violation.hint})`)}`;
    }

    return baseMessage;
};

export { formatPartialRuleViolation, formatRuleViolation };
