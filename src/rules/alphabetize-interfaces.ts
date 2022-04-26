import { diffLines } from "diff";
import { sortBy, flatten, compact, isEmpty, flatMap, first } from "lodash";
import {
    CallSignatureDeclaration,
    ConstructSignatureDeclaration,
    IndexSignatureDeclaration,
    InterfaceDeclaration,
    IntersectionTypeNode,
    Node,
    SourceFile,
    SyntaxKind,
    TypeElementTypes,
    TypeLiteralNode,
} from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";
import { RuleFunction } from "../types/rule-function";
import {
    getChildrenOfKind,
    getFirstChildOfKind,
} from "../utils/children-utils";
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

type InterfaceOrType =
    | InterfaceDeclaration
    | TypeLiteralNode
    | IntersectionTypeNode;

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

_alphabetizeInterfaces._name = RuleName.AlphabetizeInterfaces;

const alphabetizeInterface = (
    interfaceOrType: InterfaceOrType
): RuleViolation[] => {
    const underlyingType = getUnderlyingType(interfaceOrType);
    const nestedTypes = flatMap(getMembers(interfaceOrType), (member) =>
        getChildrenOfKind(
            member,
            SyntaxKind.InterfaceDeclaration,
            SyntaxKind.TypeLiteral,
            SyntaxKind.IntersectionType
        )
    );
    const hasNestedTypes = !isEmpty(nestedTypes);

    const propertyGroups = getNodeCommentGroups<
        InterfaceOrType,
        InterfaceMember
    >(interfaceOrType, {
        getDescendants: (node) =>
            getUnderlyingType(node).getMembersWithComments(),
        selector: isInterfaceMember,
    });

    const sorted = sortBy(propertyGroups, getPropertyName) as Array<
        NodeCommentGroup<InterfaceMember>
    >;

    // Recursively alphabetize in-line types or type unions
    const nestedErrors: RuleViolation[] = hasNestedTypes
        ? flatMap(nestedTypes, alphabetizeInterface)
        : [];

    const deletionQueue: Array<InterfaceMember | Comment> = [];

    const kindName = underlyingType.getKindName();
    const name =
        underlyingType instanceof InterfaceDeclaration
            ? underlyingType.getName()
            : "";

    let index = 0;
    const errors = sorted.map((propertyGroup) => {
        const { comment, node: property } = propertyGroup;
        const currentIndex = propertyGroups.indexOf(propertyGroup);
        const expectedIndex = sorted.indexOf(propertyGroup);

        if (comment != null) {
            deletionQueue.push(comment);
            underlyingType.insertMember(index, getCommentText(comment));
            index++;
        }

        deletionQueue.push(property);
        underlyingType.insertMember(index, property.getStructure());
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

    const concatenatedErrors = compact([...errors, ...nestedErrors]);

    if (isEmpty(concatenatedErrors)) {
        const lineNumber = underlyingType.getStartLineNumber();
        const message =
            interfaceOrType instanceof InterfaceDeclaration
                ? `Properties of ${kindName} ${name} are already sorted`
                : `Properties of ${kindName} are already sorted.`;
        Logger.ruleDebug({
            file: underlyingType.getSourceFile(),
            lineNumber,
            message,
            rule: RuleName.AlphabetizeInterfaces,
        });
    }

    return concatenatedErrors;
};

const getMembers = (interfaceOrType?: InterfaceOrType): InterfaceMember[] => {
    if (interfaceOrType == null) {
        return [];
    }

    if (interfaceOrType instanceof IntersectionTypeNode) {
        return getMembers(getUnderlyingType(interfaceOrType));
    }

    return interfaceOrType.getMembers().filter(isInterfaceMember);
};

const getPropertyName = (propertyGroup: NodeCommentGroup<InterfaceMember>) =>
    propertyGroup.node.getName();

const getUnderlyingType = (
    interfaceOrType: InterfaceOrType
): Exclude<InterfaceOrType, IntersectionTypeNode> => {
    if (interfaceOrType instanceof IntersectionTypeNode) {
        return getFirstChildOfKind(
            interfaceOrType,
            SyntaxKind.TypeLiteral,
            SyntaxKind.InterfaceDeclaration
        )!;
    }

    return interfaceOrType;
};

const isInterfaceMember = (
    maybeInterfaceMember: TypeElementTypes | InterfaceOrType
): maybeInterfaceMember is InterfaceMember =>
    Node.isPropertySignature(maybeInterfaceMember) ||
    Node.isMethodSignature(maybeInterfaceMember);

const alphabetizeInterfaces = withRetry(_alphabetizeInterfaces);

export { alphabetizeInterfaces };
