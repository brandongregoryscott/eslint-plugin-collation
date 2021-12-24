import { RuleResult } from "../interfaces/rule-result";
import { Logger } from "./logger";

const printRuleResults = (ruleResults: RuleResult[]) =>
    ruleResults.forEach(printRuleResult);

const printRuleResult = (ruleResult: RuleResult) =>
    ruleResult.errors.forEach(Logger.ruleViolation);

export { printRuleResults };
