import { diffLines } from "diff";
import { compact, flatMap, isEqual, sortBy } from "lodash";
import {
    EnumDeclaration,
    EnumMember,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";
import { RuleFunction } from "../types/rule-function";
import { getNodeCommentGroups } from "../utils/comment-utils";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { Logger } from "../utils/logger";

const alphabetizeEnums: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const enums = file.getEnums();
    const errors = flatMap(enums, alphabetizeEnum);
    removeDoubleCommas(file);
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

    const groups = getNodeCommentGroups<EnumMember>(_enum, Node.isEnumMember);

    const sortedGroups = sortBy(groups, getEnumMemberName);

    let index = 0;
    const deletionQueue: Array<Comment | EnumMember> = [];
    const errors = sortedGroups.map((group) => {
        const { comment, node: member } = group;
        const currentIndex = groups.indexOf(group);
        const expectedIndex = sortedGroups.indexOf(group);

        if (comment != null) {
            deletionQueue.push(comment);
            _enum.insertMember(index, comment.getFullText());
            index++;
        }

        deletionQueue.push(member);
        _enum.insertMember(index, member.getStructure());
        index++;

        if (currentIndex === expectedIndex) {
            return;
        }

        return new RuleViolation({
            ...getAlphabeticalMessages({
                index: currentIndex,
                expectedIndex,
                elementTypeName: "member",
                sorted: sortedGroups,
                original: groups,
                parentName: name,
                getElementName: getEnumMemberName,
            }),
            file: member.getSourceFile(),
            lineNumber: member.getStartLineNumber(),
            rule: RuleName.AlphabetizeEnums,
        });
    });

    deletionQueue.forEach((member) => {
        if (member.wasForgotten()) {
            return;
        }

        member.remove();
    });
    return compact(errors);
};

const getEnumMemberName = (group: NodeCommentGroup<EnumMember>) =>
    group.node.getName();
const getEnumName = (_enum: EnumDeclaration) => _enum.getName();

/**
 * Seems that adding single-line comments with `EnumDeclaration.insertMember` adds a trailing comma unexpectedly
 * https://github.com/dsherret/ts-morph/issues/961
 */
const removeDoubleCommas = (file: SourceFile) => {
    const commas = file
        .getDescendants()
        .filter((node) => node.getKind() === SyntaxKind.CommaToken);

    const deletionQueue: Node[] = [];
    commas.forEach((comma, index) => {
        const previousComma = commas[index - 1];
        if (previousComma?.getPos() !== comma.getPos() - 1) {
            return;
        }

        deletionQueue.push(previousComma);
    });

    deletionQueue.forEach((comma) => comma.replaceWithText(""));
};

export { alphabetizeEnums };
