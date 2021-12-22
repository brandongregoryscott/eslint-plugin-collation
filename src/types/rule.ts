import { SourceFile } from "ts-morph";
import { RuleResult } from "../interfaces/rule-result";

type Rule = (file: SourceFile) => Promise<RuleResult>;

export { Rule };
