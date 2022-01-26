import { SourceFile } from "ts-morph";
import { RuleFunction } from "../types/rule-function";
import pRetry from "p-retry";

/**
 * Wrapper for automatically applying retry functionality around a `RuleFunction`
 * which may be desirable to perform a 2nd or 3rd pass on a file, such as when nodes are forgotten
 */
const withRetry = (rule: RuleFunction) => (file: SourceFile) =>
    pRetry(() => rule(file), { retries: 3, unref: true });

export { withRetry };
