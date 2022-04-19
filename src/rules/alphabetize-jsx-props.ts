import {
    JsxAttribute,
    JsxAttributeStructure,
    JsxOpeningElement,
    JsxSelfClosingElement,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import {
    compact,
    first,
    flatMap,
    flatten,
    isEqual,
    last,
    merge,
    range,
    sortBy,
} from "lodash";
import { diffLines } from "diff";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Logger } from "../utils/logger";
import { RuleFunction } from "../types/rule-function";
import { RuleName } from "../enums/rule-name";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import {
    getCommentNodeStructures,
    getNodeCommentGroups,
} from "../utils/comment-utils";
import { withRetry } from "../utils/with-retry";
import { NodeCommentGroup } from "../types/node-comment-group";
import { JsxElement } from "../types/jsx-element";

const _alphabetizeJsxProps: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const jsxElements: Array<JsxElement> = getJsxElements(file);

    const errors = flatMap(jsxElements, alphabetizePropsByJsxElement);

    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

_alphabetizeJsxProps._name = RuleName.AlphabetizeJsxProps;

const alphabetizePropsByJsxElement = (
    jsxElement: JsxElement
): RuleViolation[] => {
    const emptyJsx = getJsxTag(jsxElement);
    const hasSpreadAssignments = jsxElement
        .getAttributes()
        .some((prop) => Node.isJsxSpreadAttribute(prop));

    if (hasSpreadAssignments) {
        return alphabetizeJsxPropsWithSpread(jsxElement);
    }

    if (propsAlreadySorted(jsxElement)) {
        return [];
    }

    const groups = getNodeCommentGroups<JsxElement, JsxAttribute>(jsxElement, {
        parseCommentRanges: true,
        selector: (node) => Node.isJsxAttribute(node),
        getDescendants: (node) => node.getAttributes(),
    });

    const sortedGroups = sortBy(groups, (group) => group.node.getName());
    const sortedPropStructures = getCommentNodeStructures<
        JsxAttribute,
        JsxAttributeStructure
    >(sortedGroups);
    const errors = removeProps(jsxElement.getAttributes() as JsxAttribute[]);

    // This clears out any trivia/comments that might have been left behind from removeProps
    jsxElement = jsxElement.replaceWithText(emptyJsx) as JsxElement;

    jsxElement.addAttributes(sortedPropStructures);

    return compact(errors);
};

/**
 * Special handling for JsxElements that contain spread props, i.e.
 * <Button onClick={() => {}} {...buttonProps} />
 * Because the ordering can change the behavior of the code, we will sort the props before and after
 * each of the spread assignments
 */
const alphabetizeJsxPropsWithSpread = (
    jsxElement: JsxElement
): RuleViolation[] => {
    if (propsAlreadySorted(jsxElement)) {
        return [];
    }

    const props = jsxElement.getAttributes();
    const groups = getNodeCommentGroups<JsxElement, JsxAttribute>(jsxElement, {
        parseCommentRanges: true,
        selector: (node) =>
            Node.isJsxAttribute(node) || Node.isJsxSpreadAttribute(node),
        getDescendants: (node) => node.getAttributes(),
    });

    const spreadPropIndexes = groups
        .map((group, index) =>
            Node.isJsxSpreadAttribute(group.node) ? index : undefined
        )
        .filter((value) => value != null) as number[]; // Can't use compact here as 0 is falsy

    let startIndex = 0;
    const indexRanges = spreadPropIndexes.map((spreadPropIndex) => {
        const indexRange = range(
            Math.min(startIndex, spreadPropIndex),
            spreadPropIndex + 1
        );
        startIndex = spreadPropIndex + 1;

        return indexRange;
    });

    if (last(spreadPropIndexes)! < props.length - 1) {
        indexRanges.push(range(last(spreadPropIndexes)! + 1, props.length + 1));
    }

    const errors = indexRanges.map((indexRange) => {
        const subsetPropGroups = groups.slice(
            first(indexRange),
            last(indexRange)
        ) as Array<NodeCommentGroup<JsxAttribute>>;
        const sortedGroups = sortBy(subsetPropGroups, (group) =>
            group.node.getName()
        );
        const sortedPropStructures = getCommentNodeStructures<
            JsxAttribute,
            JsxAttributeStructure
        >(sortedGroups);
        const errors = removeProps(subsetPropGroups.map((group) => group.node));

        jsxElement.insertAttributes(first(indexRange)!, sortedPropStructures);

        return errors;
    });

    return compact(flatten(errors));
};

const findPropertyStructureIndexByName = (
    prop: JsxAttribute,
    propStructures: JsxAttributeStructure[]
): number =>
    propStructures.findIndex(
        (propertyStructure) => propertyStructure.name === prop.getName()
    );

const getJsxElements = (file: SourceFile): Array<JsxElement> => [
    ...file.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
];

const getJsxTag = (jsxElement: JsxElement): string => {
    const endingBracket = Node.isJsxSelfClosingElement(jsxElement)
        ? " />"
        : ">";
    return `<${jsxElement.getTagNameNode().getText()}${endingBracket}`;
};

const propsAlreadySorted = (jsxElement: JsxElement): boolean => {
    const props = jsxElement
        .getAttributes()
        .filter((prop) => Node.isJsxAttribute(prop)) as JsxAttribute[];

    const sortedProps = sortBy(props, (prop) => prop.getName());

    if (!isEqual(props, sortedProps)) {
        return false;
    }

    const jsxTag = getJsxTag(jsxElement);
    const lineNumber = jsxElement.getStartLineNumber();
    Logger.ruleDebug({
        file: jsxElement.getSourceFile(),
        lineNumber,
        rule: RuleName.AlphabetizeJsxProps,
        message: `Props for ${jsxTag} are already sorted.`,
    });

    return true;
};

const removeProps = (props: JsxAttribute[]): RuleViolation[] => {
    const sortedPropStructures = sortBy(props, (prop) => prop.getName()).map(
        (prop) => prop.getStructure()
    );
    const errors = props.map((prop, index) => {
        const expectedIndex = findPropertyStructureIndexByName(
            prop as JsxAttribute,
            sortedPropStructures
        );
        const outOfOrder = expectedIndex !== index;
        const parent =
            prop.getFirstAncestorByKind(SyntaxKind.JsxOpeningElement) ??
            prop.getFirstAncestorByKindOrThrow(
                SyntaxKind.JsxSelfClosingElement
            );

        const error = new RuleViolation({
            ...getAlphabeticalMessages<JsxAttribute, JsxAttributeStructure>({
                index,
                expectedIndex,
                parentName: getJsxTag(parent),
                elementTypeName: "prop",
                original: props,
                sorted: sortedPropStructures,
                getElementName: (prop) => prop.getName(),
                getElementStructureName: (prop) => prop?.name,
            }),
            file: prop.getSourceFile(),
            lineNumber: prop.getStartLineNumber(),
            rule: RuleName.AlphabetizeJsxProps,
        });

        prop.remove();

        return outOfOrder ? error : undefined;
    });

    return compact(errors);
};

const alphabetizeJsxProps = withRetry(_alphabetizeJsxProps);

export { alphabetizeJsxProps };
