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
import { RuleError } from "../models/rule-error";
import { Logger } from "../utils/logger";

const alphabetizeJsxProps = (file: SourceFile): RuleResult => {
    const originalFileContent = file.getText();
    const jsxOpeningElements = file.getDescendantsOfKind(
        SyntaxKind.JsxOpeningElement
    );
    const errors = flatten(
        jsxOpeningElements.map(alphabetizeJsxPropsJsxElement)
    );
    const endingFileContent = file.getText();

    Logger.error("Errors:", errors);
    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizeJsxPropsJsxElement = (
    openingElement: JsxOpeningElement
): RuleError[] => {
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

    const errors = openingElement.getAttributes().map((prop, index) => {
        const expectedIndex = sortedPropStructures.findIndex(
            (sortedPropStructure) =>
                sortedPropStructure.name === (prop as JsxAttribute).getName()
        );

        const error = getRuleError(
            prop as JsxAttribute,
            props,
            sortedPropStructures
        );
        prop.remove();

        if (expectedIndex === index) {
            return;
        }
        return error;
    });

    openingElement.addAttributes(sortedPropStructures);

    return compact(errors);
};

const alphabetizeJsxPropsWithSpread = (
    openingElement: JsxOpeningElement
): RuleError[] => {
    const props = openingElement.getAttributes();

    const spreadPropIndexes = props
        .map((prop, index) =>
            Node.isJsxSpreadAttribute(prop) ? index : undefined
        )
        .filter((value) => value != null) as number[];

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

    indexRanges.forEach((indexRange) => {
        const subsetProps = props.slice(
            first(indexRange),
            last(indexRange)
        ) as JsxAttribute[];
        const propStrutures = sortBy(subsetProps, (prop) => prop.getName()).map(
            (prop) => prop.getStructure()
        );
        subsetProps.forEach((prop) => prop.remove());
        openingElement.insertAttributes(first(indexRange)!, propStrutures);
    });

    return [];
};

const findPropertyStructureIndexByName = (
    prop: JsxAttribute,
    propStructures: JsxAttributeStructure[]
): number =>
    propStructures.findIndex(
        (propertyStructure) => propertyStructure.name === prop.getName()
    );

const getRuleError = (
    prop: JsxAttribute,
    props: JsxAttribute[],
    sorted: JsxAttributeStructure[]
): RuleError | undefined => {
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
    return new RuleError({
        hint,
        file: prop.getSourceFile(),
        message,
        lineNumber: prop.getStartLineNumber(),
        rule: "alphabetize-jsx-props",
    });
};

export { alphabetizeJsxProps };
