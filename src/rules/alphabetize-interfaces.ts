import { diffLines } from "diff";
import { isEqual, sortBy, flatten, compact, isEmpty, flatMap } from "lodash";
import {
    CallSignatureDeclaration,
    ConstructSignatureDeclaration,
    IndexSignatureDeclaration,
    InterfaceDeclaration,
    IntersectionTypeNode,
    KindToNodeMappings,
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
        getDescendants: (interfaceOrType) => interfaceOrType.getMembers(),
        selector: (node) => Node.hasName(node) && Node.isTypeElement(node),
    });

    const recursiveMembers = flatMap(interfaceOrType.getMembers(), (member) =>
        getChildrenOfKind(
            member,
            SyntaxKind.TypeLiteral,
            SyntaxKind.TypeAliasDeclaration,
            SyntaxKind.IntersectionType
        )
    ) as Array<
        | KindToNodeMappings[SyntaxKind.TypeLiteral]
        | KindToNodeMappings[SyntaxKind.TypeAliasDeclaration]
        | KindToNodeMappings[SyntaxKind.IntersectionType]
    >;

    const sorted = sortBy(propertyGroups, getPropertyName) as Array<
        NodeCommentGroup<InterfaceMember>
    >;

    const nestedTypeLiterals = flatMap(propertyGroups, (group) =>
        group.node.getChildrenOfKind(SyntaxKind.TypeLiteral)
    );
    let nestedTypeErrors: RuleViolation[] = [];
    if (!isEmpty(nestedTypeLiterals)) {
        nestedTypeErrors = flatMap(nestedTypeLiterals, alphabetizeInterface);
    }

    // if (isEqual(propertyGroups, sorted)) {
    //     const lineNumber = interfaceOrType.getStartLineNumber();
    //     const message =
    //         interfaceOrType instanceof InterfaceDeclaration
    //             ? `Properties of ${kindName} ${name} are already sorted`
    //             : `Properties of ${kindName} are already sorted.`;
    //     Logger.ruleDebug({
    //         file: interfaceOrType.getSourceFile(),
    //         lineNumber,
    //         message,
    //         rule: RuleName.AlphabetizeInterfaces,
    //     });

    //     return [];
    // }

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
    return compact([...errors, ...nestedTypeErrors]);
};

const getChildrenOfKind = <T extends SyntaxKind[]>(node: Node, ...kinds: T) =>
    flatMap(kinds, (kind) => node.getChildrenOfKind(kind));

const getPropertyName = (propertyGroup: NodeCommentGroup<InterfaceMember>) =>
    propertyGroup.node.getName();

const alphabetizeInterfaces = withRetry(_alphabetizeInterfaces);

export { alphabetizeInterfaces };
