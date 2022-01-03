import { RuleName } from "../enums/rule-name";
import { alphabetizeDependencyLists } from "../rules/alphabetize-dependency-lists";
import { alphabetizeEnums } from "../rules/alphabetize-enums";
import { alphabetizeInterfaces } from "../rules/alphabetize-interfaces";
import { alphabetizeJsxProps } from "../rules/alphabetize-jsx-props";
import { RuleFunction } from "../types/rule-function";

const RuleMap: Record<RuleName, RuleFunction> = {
    [RuleName.AlphabetizeDependencyLists]: alphabetizeDependencyLists,
    [RuleName.AlphabetizeEnums]: alphabetizeEnums,
    [RuleName.AlphabetizeInterfaces]: alphabetizeInterfaces,
    [RuleName.AlphabetizeJsxProps]: alphabetizeJsxProps,
};

export { RuleMap };
