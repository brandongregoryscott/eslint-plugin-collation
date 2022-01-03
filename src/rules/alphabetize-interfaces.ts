import { diffLines } from "diff";
import { isEqual, sortBy, flatten, compact } from "lodash";
import {
    CallSignatureDeclaration,
    CommentClassElement,
    CommentEnumMember,
    CommentObjectLiteralElement,
    CommentStatement,
    CommentTypeElement,
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
import { RuleFunction } from "../types/rule-function";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { Logger } from "../utils/logger";

type InterfaceMember = Exclude<
    TypeElementTypes,
    | ConstructSignatureDeclaration
    | CallSignatureDeclaration
    | IndexSignatureDeclaration
>;

interface PropertyGroup {
    comment?: Comment;
    property: InterfaceMember;
}

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
    const propertyOrComments = _interface
        .getDescendants()
        .filter(
            (node) =>
                (Node.hasName(node) && Node.isTypeElement(node)) ||
                Node.isCommentNode(node)
        ) as Array<Comment | InterfaceMember>;

    const propertyGroups = compact(
        propertyOrComments.map((commentOrProperty, index) =>
            toPropertyGroup(propertyOrComments, commentOrProperty, index)
        )
    );

    const sorted = sortBy(propertyGroups, getPropertyName);

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
        const { comment, property } = propertyGroup;
        const currentIndex = propertyGroups.indexOf(propertyGroup);
        const expectedIndex = sorted.indexOf(propertyGroup);

        if (comment != null) {
            deletionQueue.push(comment);
            _interface.insertMember(index, comment.getText(true));
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

    deletionQueue.forEach((node) => node.remove());
    return compact(errors);
};

const getPropertyName = (propertyGroup: PropertyGroup) =>
    propertyGroup.property.getName();

const toPropertyGroup = (
    propertyOrCommentNodes: Array<InterfaceMember | Comment>,
    commentOrProperty: InterfaceMember | Comment,
    index: number
): PropertyGroup | undefined => {
    if (Node.isCommentNode(commentOrProperty)) {
        return;
    }
    const previousNode = propertyOrCommentNodes[index - 1];

    return {
        comment: Node.isCommentNode(previousNode) ? previousNode : undefined,
        property: commentOrProperty,
    };
};

export { alphabetizeInterfaces };
