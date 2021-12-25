import { SourceFile } from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { formatRuleViolation } from "../utils/string-utils";

class RuleViolation extends Error {
    public readonly file: SourceFile;
    public readonly lineNumber: number;
    public readonly message: string;
    public readonly rule: RuleName;
    public readonly hint?: string;

    constructor(
        error: Pick<
            RuleViolation,
            "file" | "hint" | "message" | "lineNumber" | "rule"
        >
    ) {
        const { file, lineNumber, message, hint, rule } = error;
        super(message);

        this.file = file;
        this.hint = hint;
        this.lineNumber = lineNumber;
        this.message = message;
        this.rule = rule;
    }

    public format(): string {
        return formatRuleViolation(this);
    }
}

export { RuleViolation };
