import { RuleName } from "../enums/rule-name";
import { alphabetizeDependencyLists } from "../rules/alphabetize-dependency-lists";
import { alphabetizeInterfaces } from "../rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "../rules/alphabetize-jsx-props";
import { RuleFunction } from "../types/rule-function";

const RuleMap: Record<RuleName, RuleFunction> = {
    [RuleName.AlphabetizeDependencyLists]: alphabetizeDependencyLists,
    [RuleName.AlphabetizeInterfaces]: alphabetizeInterfaces,
    [RuleName.AlphabetizeJsxProps]: alphabetizeJsxProps,
};

export { RuleMap };
