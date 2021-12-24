import { flatten } from "lodash";
import { SourceFile } from "ts-morph";
import { RuleMap } from "../constants/rule-map";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { printRuleResults } from "./print-rule-results";

const ruleRunner = async (
    files: SourceFile[],
    rules?: RuleName[]
): Promise<RuleResult[]> => {
    rules = rules ?? Object.values(RuleName);

    const results = await Promise.all(
        flatten(
            rules.map((rule) => {
                const ruleFunction = RuleMap[rule];
                return files.map(ruleFunction);
            })
        )
    );

    printRuleResults(results);

    return results;
};

export { ruleRunner };
