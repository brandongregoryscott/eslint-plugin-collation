import { SourceFile } from "ts-morph";

class RuleViolation extends Error {
    public readonly file: SourceFile;
    public readonly linePosition?: number;
    public readonly lineNumber: number;
    public readonly message: string;
    public readonly rule: string;
    public readonly hint?: string;

    constructor(
        error: Pick<
            RuleViolation,
            "file" | "hint" | "message" | "lineNumber" | "linePosition" | "rule"
        >
    ) {
        const { file, linePosition, lineNumber, message, hint, rule } = error;
        super(message);

        this.file = file;
        this.hint = hint;
        this.lineNumber = lineNumber;
        this.linePosition = linePosition;
        this.message = message;
        this.rule = rule;
    }
}

export { RuleViolation };
