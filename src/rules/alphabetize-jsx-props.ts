import {
    JsxAttribute,
    JsxElement,
    Node,
    SourceFile,
    SyntaxKind,
} from "ts-morph";
import shell from "shelljs";
import { isEqual, sortBy } from "lodash";

const supportedExtensions = [".jsx", ".tsx"];

const alphabetizeJsxProps = (file: SourceFile): SourceFile => {
    if (!supportedExtensions.includes(file.getExtension())) {
        shell.echo(`File extension not supported: ${file.getExtension()}`);
        return file;
    }

    const jsxElements = file.getDescendantsOfKind(SyntaxKind.JsxElement);
    jsxElements.forEach((jsxElement: JsxElement) => {
        const openingElement = jsxElement.getOpeningElement();
        const props = openingElement
            .getAttributes()
            .filter((prop) => Node.isJsxAttribute(prop)) as JsxAttribute[]; // Not handling spread assignments yet
        const sortedProps = sortBy(props, (prop) => prop.getName());

        if (isEqual(props, sortedProps)) {
            const jsxTag = `<${openingElement.getTagNameNode().getText()} />`;
            const fileName = openingElement.getSourceFile().getBaseName();
            const lineNumber = openingElement.getStartLinePos();
            shell.echo(
                `Props for ${jsxTag} on line ${lineNumber} of ${fileName} are already sorted.`
            );
            return;
        }

        const propStructures = sortedProps.map((prop) => prop.getStructure());
        props.forEach((prop) => prop.remove());
        openingElement.addAttributes(propStructures);
    });

    return file;
};

export { alphabetizeJsxProps };
