import { Change } from "diff";
import { SourceFile } from "ts-morph";
import { RuleViolation } from "../models/rule-violation";

interface RuleResult {
    diff: Change[];
    errors: RuleViolation[];
    file: SourceFile;
}

export type { RuleResult };
