import "jest-extended";
import { SourceFile } from "ts-morph";
import { RuleResult } from "./interfaces/rule-result";

type MatcherNotCompatibleWithType =
    "Matcher is not implemented for the given type.";

declare global {
    namespace jest {
        interface Matchers<R, T> {
            toHaveErrors: T extends RuleResult
                ? () => R
                : MatcherNotCompatibleWithType;
            toMatchSourceFile: T extends RuleResult
                ? (expected: SourceFile) => R
                : T extends SourceFile
                ? (expected: SourceFile) => R
                : MatcherNotCompatibleWithType;
        }
    }
}
