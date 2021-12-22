import { Change } from "diff";
import { SourceFile } from "ts-morph";
import { RuleError } from "../models/rule-error";

interface RuleResult {
    diff: Change[];
    file: SourceFile;
    errors: RuleError[];
}

export type { RuleResult };
