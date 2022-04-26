import { SourceFile } from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";

type RuleFunction = ((file: SourceFile) => Promise<RuleResult>) & {
    _name: RuleName;
};

export { RuleFunction };
