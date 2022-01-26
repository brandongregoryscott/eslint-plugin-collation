import {
    JsxAttribute,
    JsxAttributedNode,
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
    flatten,
    isEmpty,
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
import { getNodeCommentGroups } from "../utils/comment-utils";
import { isForgottenNodeError } from "../utils/error-utils";
import {
    formatPartialRuleViolation,
    formatRuleViolation,
} from "../utils/string-utils";

const maxRetries = 5;
let retryMap: Record<string, number> = {};

const alphabetizeJsxProps: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const fileName = file.getBaseName();
    const originalFileContent = file.getText();
    let errors: RuleViolation[] = [];

    try {
        const jsxElements: Array<JsxOpeningElement | JsxSelfClosingElement> =
            sortBy(
                [
                    ...file.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
                    ...file.getDescendantsOfKind(
                        SyntaxKind.JsxSelfClosingElement
                    ),
                ],
                // Sort by JsxElements that are children of JsxExpressions, which means they are being
                // passed as props. This resolves the forgotten node error when traversing & manipulating the AST
                (element) =>
                    element.getParentIfKind(SyntaxKind.JsxExpression) == null
            );
        errors = [
            ...errors,
            ...flatten(jsxElements.map(alphabetizePropsByJsxElement)),
        ];
    } catch (error) {
        if (isForgottenNodeError(error)) {
            retryMap = merge({}, retryMap, {
                [fileName]: (retryMap[fileName] ?? 0) + 1,
            });

            if (retryMap[fileName] > maxRetries) {
                throw new Error(
                    formatPartialRuleViolation({
                        rule: RuleName.AlphabetizeJsxProps,
                        file,
                        message: `Attempted to resolve forgotten node errors ${maxRetries} times. Bailing.`,
                    })
                );
            }

            return alphabetizeJsxProps(file);
        }

        Logger.error("Unhandled error in retry catch: ", error);
    }

    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizePropsByJsxElement = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
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

    const groups = getNodeCommentGroups<
        JsxSelfClosingElement | JsxOpeningElement,
        JsxAttribute
    >(
        jsxElement,
        (node) => Node.isJsxAttribute(node),
        (node) => node.getAttributes()
    );

    const sortedGroups = sortBy(groups, (group) => group.node.getName());
    const sortedPropStructures = sortedGroups.map((group) =>
        merge({}, group.node.getStructure(), {
            leadingTrivia: group.comment?.getText(),
        })
    );
    const errors = removeProps(jsxElement.getAttributes() as JsxAttribute[]);

    // This clears out any trivia/comments that might have been left behind from removeProps
    jsxElement = jsxElement.replaceWithText(emptyJsx) as
        | JsxSelfClosingElement
        | JsxOpeningElement;

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
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
): RuleViolation[] => {
    if (propsAlreadySorted(jsxElement)) {
        return [];
    }

    const props = jsxElement.getAttributes();
    const spreadPropIndexes = props
        .map((prop, index) =>
            Node.isJsxSpreadAttribute(prop) ? index : undefined
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
        const subsetProps = props.slice(
            first(indexRange),
            last(indexRange)
        ) as JsxAttribute[];
        const sortedPropStructures = sortBy(subsetProps, (prop) =>
            prop.getName()
        ).map((prop) => prop.getStructure());

        const errors = removeProps(subsetProps);
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

const getJsxTag = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
): string => {
    const endingBracket = Node.isJsxSelfClosingElement(jsxElement)
        ? " />"
        : ">";
    return `<${jsxElement.getTagNameNode().getText()}${endingBracket}`;
};

const propsAlreadySorted = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
): boolean => {
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
                getElementStructureName: (prop) => prop.name,
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

export { alphabetizeJsxProps };
