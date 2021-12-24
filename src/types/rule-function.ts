import { SourceFile } from "ts-morph";
import { RuleResult } from "../interfaces/rule-result";

type RuleFunction = (file: SourceFile) => Promise<RuleResult>;

export { RuleFunction };
