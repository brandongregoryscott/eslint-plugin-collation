import {
    JsxAttribute,
    JsxElement,
    JsxOpeningElement,
    JsxSpreadAttributeStructure,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import { first, isEqual, last, range, sortBy } from "lodash";

const supportedExtensions = [".jsx", ".tsx"];

const alphabetizeJsxProps = (file: SourceFile): SourceFile => {
    if (!supportedExtensions.includes(file.getExtension())) {
        return file;
    }

    const jsxElements = file.getDescendantsOfKind(SyntaxKind.JsxElement);
    jsxElements.forEach((jsxElement: JsxElement) => {
        const openingElement = jsxElement.getOpeningElement();
        const hasSpreadAssignments = openingElement
            .getAttributes()
            .some((prop) => Node.isJsxSpreadAttribute(prop));

        if (hasSpreadAssignments) {
            alphabetizeJsxPropsWithSpread(openingElement);
            return;
        }

        const props = openingElement
            .getAttributes()
            .filter((prop) => Node.isJsxAttribute(prop)) as JsxAttribute[];

        const sortedProps = sortBy(props, (prop) => prop.getName());

        if (isEqual(props, sortedProps)) {
            const jsxTag = `<${openingElement.getTagNameNode().getText()} />`;
            const fileName = openingElement.getSourceFile().getBaseName();
            const lineNumber = openingElement.getStartLineNumber();
            console.log(
                `Props for ${jsxTag} on line ${lineNumber} of ${fileName} are already sorted.`
            );
            return;
        }

        const propStructures = sortedProps.map((prop) => prop.getStructure());
        openingElement.getAttributes().forEach((prop) => prop.remove());
        openingElement.addAttributes(propStructures);
    });

    return file;
};

const alphabetizeJsxPropsWithSpread = (openingElement: JsxOpeningElement) => {
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
};

export { alphabetizeJsxProps };
