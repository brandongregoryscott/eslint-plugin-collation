import { SourceFile } from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";

type NamedRuleFunction = RuleFunction & { __name: RuleName };

type RuleFunction = (file: SourceFile) => Promise<RuleResult>;

export { NamedRuleFunction, RuleFunction };
