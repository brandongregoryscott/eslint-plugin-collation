import { diffLines } from "diff";
import { isEqual, sortBy, flatten, compact, isEmpty, flatMap } from "lodash";
import {
    CallSignatureDeclaration,
    ConstructSignatureDeclaration,
    IndexSignatureDeclaration,
    InterfaceDeclaration,
    Node,
    SourceFile,
    SyntaxKind,
    TypeAliasDeclaration,
    TypeElementTypes,
    TypeLiteralNode,
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
import { withRetry } from "../utils/with-retry";

type InterfaceMember = Exclude<
    TypeElementTypes,
    | ConstructSignatureDeclaration
    | CallSignatureDeclaration
    | IndexSignatureDeclaration
>;

const _alphabetizeInterfaces: RuleFunction = async (
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

_alphabetizeInterfaces.__name = RuleName.AlphabetizeInterfaces;

const alphabetizeInterface = (
    interfaceOrType: InterfaceDeclaration | TypeLiteralNode
): RuleViolation[] => {
    const kindName = interfaceOrType.getKindName();
    const name =
        interfaceOrType instanceof InterfaceDeclaration
            ? interfaceOrType.getName()
            : "";

    const hasNestedTypes = interfaceOrType
        .getMembers()
        .some(
            (member) =>
                !isEmpty(member.getChildrenOfKind(SyntaxKind.TypeLiteral))
        );
    const propertyGroups = getNodeCommentGroups<
        InterfaceDeclaration | TypeLiteralNode,
        InterfaceMember
    >(interfaceOrType, {
        getDescendants: hasNestedTypes
            ? (_interface) => _interface.getMembers()
            : undefined,
        selector: (node) => Node.hasName(node) && Node.isTypeElement(node),
    });

    const sorted = sortBy(propertyGroups, getPropertyName) as Array<
        NodeCommentGroup<InterfaceMember>
    >;

    const nestedTypeLiterals = flatMap(propertyGroups, (group) =>
        group.node.getChildrenOfKind(SyntaxKind.TypeLiteral)
    );
    let nestedErrors: RuleViolation[] = [];
    if (!isEmpty(nestedTypeLiterals)) {
        nestedErrors = flatMap(nestedTypeLiterals, alphabetizeInterface);
    }

    if (isEqual(propertyGroups, sorted)) {
        const lineNumber = interfaceOrType.getStartLineNumber();
        const message =
            interfaceOrType instanceof InterfaceDeclaration
                ? `Properties of ${kindName} ${name} are already sorted`
                : `Properties of ${kindName} are already sorted.`;
        Logger.ruleDebug({
            file: interfaceOrType.getSourceFile(),
            lineNumber,
            message,
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
            interfaceOrType.insertMember(index, getCommentText(comment));
            index++;
        }

        deletionQueue.push(property);
        interfaceOrType.insertMember(index, property.getStructure());
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
                parentName: name,
                getElementName: getPropertyName,
                getElementStructureName: getPropertyName,
            }),
            file: interfaceOrType.getSourceFile(),
            lineNumber: property.getStartLineNumber(),
            rule: RuleName.AlphabetizeInterfaces,
        });
    });

    deletionQueue.forEach((node) => {
        if (node.wasForgotten()) {
            return;
        }

        node.remove();
    });
    return compact([...errors, ...nestedErrors]);
};

const getPropertyName = (propertyGroup: NodeCommentGroup<InterfaceMember>) =>
    propertyGroup.node.getName();

const alphabetizeInterfaces = withRetry(_alphabetizeInterfaces);

export { alphabetizeInterfaces };
