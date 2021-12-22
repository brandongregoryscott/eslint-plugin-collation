import { Change } from "diff";
import { SourceFile } from "ts-morph";
import { RuleViolation } from "../models/rule-violation";

interface RuleResult {
    diff: Change[];
    file: SourceFile;
    errors: RuleViolation[];
}

export type { RuleResult };
