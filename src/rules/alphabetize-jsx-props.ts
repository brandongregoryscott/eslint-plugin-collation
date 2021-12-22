import {
    JsxAttribute,
    JsxAttributeStructure,
    JsxOpeningElement,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import { compact, first, flatten, isEqual, last, range, sortBy } from "lodash";
import { diffLines } from "diff";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { Logger } from "../utils/logger";

const alphabetizeJsxProps = (file: SourceFile): RuleResult => {
    const originalFileContent = file.getText();
    const jsxOpeningElements = file.getDescendantsOfKind(
        SyntaxKind.JsxOpeningElement
    );
    const errors = flatten(
        jsxOpeningElements.map(alphabetizePropsByJsxElement)
    );
    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizePropsByJsxElement = (
    openingElement: JsxOpeningElement
): RuleViolation[] => {
    const hasSpreadAssignments = openingElement
        .getAttributes()
        .some((prop) => Node.isJsxSpreadAttribute(prop));

    if (hasSpreadAssignments) {
        return alphabetizeJsxPropsWithSpread(openingElement);
    }

    const props = openingElement
        .getAttributes()
        .filter((prop) => Node.isJsxAttribute(prop)) as JsxAttribute[];

    const sortedProps = sortBy(props, (prop) => prop.getName());

    if (isEqual(props, sortedProps)) {
        const jsxTag = `<${openingElement.getTagNameNode().getText()} />`;
        const fileName = openingElement.getSourceFile().getBaseName();
        const lineNumber = openingElement.getStartLineNumber();
        Logger.debug(
            `Props for ${jsxTag} on line ${lineNumber} of ${fileName} are already sorted.`
        );
        return [];
    }

    const sortedPropStructures = sortedProps.map((prop) => prop.getStructure());
    const errors = removeProps(props);
    openingElement.addAttributes(sortedPropStructures);

    return compact(errors);
};

/**
 * Special handling for JsxElements that contain spread props, i.e.
 * <Button onClick={() => {}} {...buttonProps} />
 * Because the ordering can change the behavior of the code, we will sort the props before and after
 * each of the spread assignments
 */
const alphabetizeJsxPropsWithSpread = (
    openingElement: JsxOpeningElement
): RuleViolation[] => {
    const props = openingElement.getAttributes();

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
        openingElement.insertAttributes(
            first(indexRange)!,
            sortedPropStructures
        );

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

const getRuleViolation = (
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

    const message = `Expected prop '${propertyName}' (index ${originalIndex}) to be at index ${expectedIndex}.`;
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
        const error = getRuleViolation(
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
