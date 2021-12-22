import { Change } from "diff";
import { RuleError } from "models/rule-error";
import { SourceFile } from "ts-morph";

interface RuleResult {
    diff: Change[];
    file: SourceFile;
    errors: RuleError[];
}

export type { RuleResult };
