import {
    JsxAttribute,
    JsxAttributeStructure,
    JsxOpeningElement,
    JsxSelfClosingElement,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import { compact, first, flatten, isEqual, last, range, sortBy } from "lodash";
import { diffLines } from "diff";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Logger } from "../utils/logger";
import { RuleFunction } from "../types/rule-function";
import { RuleName } from "../enums/rule-name";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { getNodeCommentGroups } from "../utils/comment-utils";
import { NodeCommentGroup } from "../types/node-comment-group";

const alphabetizeJsxProps: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    let aggregatedErrors: RuleViolation[] = [];

    file.forEachDescendant((node) => {
        if (
            !Node.isJsxOpeningElement(node) &&
            !Node.isJsxSelfClosingElement(node)
        ) {
            return;
        }

        const errors = alphabetizePropsByJsxElement(
            node as JsxOpeningElement | JsxSelfClosingElement
        );

        aggregatedErrors = aggregatedErrors.concat(errors);
    });

    const endingFileContent = file.getText();

    return {
        errors: aggregatedErrors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizePropsByJsxElement = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
): RuleViolation[] => {
    const refreshJsxElement = getRefreshJsxElementFunction(jsxElement);
    const hasSpreadAssignments = jsxElement
        .getAttributes()
        .some((prop) => Node.isJsxSpreadAttribute(prop));

    if (hasSpreadAssignments) {
        return alphabetizeJsxPropsWithSpread(jsxElement);
    }

    if (propsAlreadySorted(jsxElement)) {
        return [];
    }

    const groups = getNodeCommentGroups<JsxAttribute>(jsxElement, (node) =>
        Node.isJsxAttribute(node)
    );
    const sortedGroups = sortBy(groups, (group) => group.node.getName());
    const sortedPropStructures = sortedGroups.map((group) =>
        group.node.getStructure()
    );
    const errors = _getErrors(groups, sortedPropStructures);

    groups.forEach((group) => {
        if (group.comment == null) {
            return;
        }

        // The comment removal may forget the underlying JsxElement node, so be sure to refresh after
        group.comment.remove();
        jsxElement = refreshJsxElement();
    });

    jsxElement = refreshJsxElement();
    jsxElement.getAttributes().forEach((attribute) => attribute.remove());

    sortedGroups.forEach((group, index) => {
        const { comment } = group;
        const structure = sortedPropStructures[index];

        jsxElement.addAttribute({
            ...structure,
            leadingTrivia: comment?.getFullText(),
        });
    });

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
): string => `<${jsxElement.getTagNameNode().getText()} />`;

const getRefreshJsxElementFunction = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement
): (() => JsxOpeningElement | JsxSelfClosingElement) => {
    const sourceFile = jsxElement.getSourceFile();
    const kind = jsxElement.getKind();
    const name = jsxElement.getTagNameNode().getText();
    const refreshJsxElement = () =>
        sourceFile
            .getDescendantsOfKind(kind)
            .find(
                (jsxElement) =>
                    (jsxElement as JsxOpeningElement | JsxSelfClosingElement)
                        .getTagNameNode()
                        .getText() === name
            ) as JsxSelfClosingElement | JsxOpeningElement;

    return refreshJsxElement;
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

const _getErrors = (
    groups: Array<NodeCommentGroup<JsxAttribute>>,
    sortedPropStructures: Array<JsxAttributeStructure>
): RuleViolation[] => {
    const errors = groups.map((group, index) => {
        const { node: prop } = group;
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
            ...getAlphabeticalMessages<
                NodeCommentGroup<JsxAttribute>,
                JsxAttributeStructure
            >({
                index,
                expectedIndex,
                parentName: getJsxTag(parent),
                elementTypeName: "prop",
                original: groups,
                sorted: sortedPropStructures,
                getElementName: (group) => group.node.getName(),
                getElementStructureName: (prop) => prop.name,
            }),
            file: prop.getSourceFile(),
            lineNumber: prop.getStartLineNumber(),
            rule: RuleName.AlphabetizeJsxProps,
        });

        return outOfOrder ? error : undefined;
    });

    return compact(errors);
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
