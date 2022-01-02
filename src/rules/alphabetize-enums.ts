import { diffLines } from "diff";
import { compact, flatMap, isEqual, sortBy } from "lodash";
import { EnumDeclaration, EnumMember, SourceFile } from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { Logger } from "../utils/logger";

const alphabetizeEnums: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const enums = file.getEnums();
    const errors = flatMap(enums, alphabetizeEnum);
    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizeEnum = (_enum: EnumDeclaration): RuleViolation[] => {
    const members = _enum.getMembers();
    const name = getEnumName(_enum);
    if (members.some((member) => !member.hasInitializer())) {
        Logger.ruleDebug({
            file: _enum.getSourceFile(),
            lineNumber: _enum.getStartLineNumber(),
            message: `Enum ${name} contains member(s) without initializers and can't be alphabetized.`,
            rule: RuleName.AlphabetizeEnums,
        });
        return [];
    }

    const sorted = sortBy(members, getEnumName) as EnumMember[];

    if (isEqual(members, sorted)) {
        Logger.ruleDebug({
            file: _enum.getSourceFile(),
            lineNumber: _enum.getStartLineNumber(),
            message: `Members of enum ${name} are already alphabetized.`,
            rule: RuleName.AlphabetizeEnums,
        });
        return [];
    }

    const deletionQueue: EnumMember[] = [];
    const errors = sorted.map((member) => {
        const currentIndex = members.indexOf(member);
        const expectedIndex = sorted.indexOf(member);

        deletionQueue.push(member);
        _enum.insertMember(expectedIndex, member.getStructure());

        if (currentIndex === expectedIndex) {
            return;
        }

        return new RuleViolation({
            ...getAlphabeticalMessages({
                index: currentIndex,
                expectedIndex,
                elementTypeName: "member",
                sorted,
                original: members,
                parentName: name,
                getElementName: getEnumMemberName,
                getElementStructureName: getEnumMemberName,
            }),
            file: member.getSourceFile(),
            lineNumber: member.getStartLineNumber(),
            rule: RuleName.AlphabetizeEnums,
        });
    });

    deletionQueue.forEach((member) => member.remove());
    return compact(errors);
};

const getEnumMemberName = (enumMember: EnumMember) => enumMember.getName();
const getEnumName = (_enum: EnumDeclaration) => _enum.getName();

export { alphabetizeEnums };
