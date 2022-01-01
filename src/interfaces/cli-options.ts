import { RuleName } from "../enums/rule-name";

interface CliOptions {
    all?: boolean;
    dry?: boolean;
    files?: string[];
    printProject?: boolean;
    rules?: RuleName[];
    silent?: boolean;
    verbose?: boolean;
}

export type { CliOptions };
