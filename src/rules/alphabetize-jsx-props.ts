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

const alphabetizeJsxProps: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const jsxElements: Array<JsxOpeningElement | JsxSelfClosingElement> =
        sortBy(
            [
                ...file.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
                ...file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
            ],
            // Sort by JsxElements that are children of JsxExpressions, which means they are being
            // passed as props. This resolves the forgotten node error when traversing & manipulating the AST
            (element) =>
                element.getParentIfKind(SyntaxKind.JsxExpression) == null
        );
    const errors = flatten(jsxElements.map(alphabetizePropsByJsxElement));
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
    const hasSpreadAssignments = jsxElement
        .getAttributes()
        .some((prop) => Node.isJsxSpreadAttribute(prop));

    if (hasSpreadAssignments) {
        return alphabetizeJsxPropsWithSpread(jsxElement);
    }

    const props = jsxElement
        .getAttributes()
        .filter((prop) => Node.isJsxAttribute(prop)) as JsxAttribute[];

    const sortedProps = sortBy(props, (prop) => prop.getName());

    if (isEqual(props, sortedProps)) {
        const jsxTag = getJsxTag(jsxElement);
        const fileName = jsxElement.getSourceFile().getBaseName();
        const lineNumber = jsxElement.getStartLineNumber();
        Logger.debug(
            `Props for ${jsxTag} on line ${lineNumber} of ${fileName} are already sorted.`
        );
        return [];
    }

    const sortedPropStructures = sortedProps.map((prop) => prop.getStructure());
    const errors = removeProps(props);
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

const getRuleViolation = (
    jsxElement: JsxOpeningElement | JsxSelfClosingElement,
    prop: JsxAttribute,
    props: JsxAttribute[],
    sorted: JsxAttributeStructure[]
): RuleViolation | undefined => {
    const propertyName = prop.getName();
    const originalIndex = props.indexOf(prop);
    const expectedIndex = findPropertyStructureIndexByName(prop, sorted);
    const propertyMovedToLastPosition = expectedIndex + 1 === props.length;
    const relativePropertyName =
        sorted[
            propertyMovedToLastPosition ? expectedIndex - 1 : expectedIndex + 1
        ]?.name;
    const relativePosition = propertyMovedToLastPosition ? "after" : "before";
    const hint = `'${propertyName}' should appear alphabetically ${relativePosition} '${relativePropertyName}'.`;
    const jsxTag = getJsxTag(jsxElement);
    const message = `Expected prop '${propertyName}' in ${jsxTag} (index ${originalIndex}) to be at index ${expectedIndex}.`;
    return new RuleViolation({
        hint,
        file: prop.getSourceFile(),
        message,
        lineNumber: prop.getStartLineNumber(),
        rule: "alphabetize-jsx-props",
    });
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
        const error = getRuleViolation(
            parent,
            prop as JsxAttribute,
            props,
            sortedPropStructures
        );

        prop.remove();

        return outOfOrder ? error : undefined;
    });

    return compact(errors);
};

export { alphabetizeJsxProps };
