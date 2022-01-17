import { diffLines } from "diff";
import { isEqual, sortBy, flatten, compact } from "lodash";
import {
    CallSignatureDeclaration,
    ConstructSignatureDeclaration,
    IndexSignatureDeclaration,
    InterfaceDeclaration,
    Node,
    SourceFile,
    TypeElementTypes,
} from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";
import { RuleFunction } from "../types/rule-function";
import { getCommentText, getNodeCommentGroups } from "../utils/comment-utils";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { Logger } from "../utils/logger";
import { safelyRemoveAll } from "../utils/node-utils";

type InterfaceMember = Exclude<
    TypeElementTypes,
    | ConstructSignatureDeclaration
    | CallSignatureDeclaration
    | IndexSignatureDeclaration
>;

const alphabetizeInterfaces: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const interfaces = file.getInterfaces();
    const errors = flatten(interfaces.map(alphabetizeInterface));
    const endingFileContent = file.getText();

    return {
        file,
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
    };
};

const alphabetizeInterface = (
    _interface: InterfaceDeclaration
): RuleViolation[] => {
    const propertyGroups = getNodeCommentGroups<InterfaceMember>(
        _interface,
        (node) => Node.hasName(node) && Node.isTypeElement(node)
    );

    const sorted = sortBy(propertyGroups, getPropertyName) as Array<
        NodeCommentGroup<InterfaceMember>
    >;

    if (isEqual(propertyGroups, sorted)) {
        const lineNumber = _interface.getStartLineNumber();
        Logger.ruleDebug({
            file: _interface.getSourceFile(),
            lineNumber,
            message: `Properties of interface ${_interface.getName()} are already sorted.`,
            rule: RuleName.AlphabetizeInterfaces,
        });

        return [];
    }

    const deletionQueue: Array<InterfaceMember | Comment> = [];

    let index = 0;
    const errors = sorted.map((propertyGroup) => {
        const { comment, node: property } = propertyGroup;
        const currentIndex = propertyGroups.indexOf(propertyGroup);
        const expectedIndex = sorted.indexOf(propertyGroup);

        if (comment != null) {
            deletionQueue.push(comment);
            _interface.insertMember(index, getCommentText(comment));
            index++;
        }

        deletionQueue.push(property);
        _interface.insertMember(index, property.getStructure());
        index++;

        if (currentIndex === expectedIndex) {
            return;
        }

        return new RuleViolation({
            ...getAlphabeticalMessages({
                index: currentIndex,
                expectedIndex,
                elementTypeName: "property",
                sorted,
                original: propertyGroups,
                parentName: _interface.getName(),
                getElementName: getPropertyName,
                getElementStructureName: getPropertyName,
            }),
            file: _interface.getSourceFile(),
            lineNumber: property.getStartLineNumber(),
            rule: RuleName.AlphabetizeInterfaces,
        });
    });

    safelyRemoveAll(deletionQueue);

    return compact(errors);
};

const getPropertyName = (propertyGroup: NodeCommentGroup<InterfaceMember>) =>
    propertyGroup.node.getName();

export { alphabetizeInterfaces };
