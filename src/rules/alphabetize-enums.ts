import { SourceFile } from "ts-morph";
import { RuleResult } from "../interfaces/rule-result";
import { RuleFunction } from "../types/rule-function";

const alphabetizeEnums: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    return { errors: [], diff: [], file };
};

export { alphabetizeEnums };
