import { TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import { ComponentType } from "../types/component-type";
import first from "lodash/first";
import { getExportSpecifiers, getName, isChildOf } from "./node-utils";
import isEmpty from "lodash/isEmpty";
import camelCase from "lodash/camelCase";
import lowerCase from "lodash/lowerCase";
import kebabCase from "lodash/kebabCase";
import snakeCase from "lodash/snakeCase";
import intersection from "lodash/intersection";
import takeRight from "lodash/takeRight";

const nameTransformations = [camelCase, lowerCase, kebabCase, snakeCase];

const isComponent = (
    declaration: ComponentType,
    jsxElements: TSESTree.JSXElement[]
): boolean => {
    const jsxElementChild = jsxElements.find((jsxElement) =>
        isChildOf(jsxElement, declaration)
    );

    return jsxElementChild != null;
};

const isPrimaryComponent = <TContext extends RuleContext<any, any[]>>(
    component: ComponentType,
    components: ComponentType[],
    context: TContext,
    defaultExports: TSESTree.ExportDefaultDeclaration[],
    namedExports: TSESTree.ExportNamedDeclaration[]
): boolean => {
    const componentName = getName(component);

    const isDefaultExport = defaultExports.some(
        (defaultExport) => getName(defaultExport) === componentName
    );

    const baseFilename = first(context.getFilename().split("."))!;

    const directoryName = first(
        takeRight((context.getCwd?.() ?? "").split("/"), 2)
    )!;
    const matchesDirectoryName =
        lowerCase(baseFilename) === "index" &&
        matchesName(component, directoryName);

    const isFirstExport = namedExports.some(
        (namedExport) =>
            (getExportSpecifiers(namedExport).includes(componentName!) ||
                getName(namedExport) === componentName) &&
            component === first(components)
    );

    return (
        isDefaultExport ||
        matchesName(component, baseFilename) ||
        matchesDirectoryName ||
        isFirstExport
    );
};

const matchesName = (component: ComponentType, name: string): boolean => {
    const componentName = getName(component)!;

    if (isEmpty(componentName) || isEmpty(name)) {
        return false;
    }

    const namePermutations = nameTransformations.map((transform) =>
        transform(name)
    );
    const componentNamePermutations = nameTransformations.map((transform) =>
        transform(componentName)
    );

    const matches = intersection(namePermutations, componentNamePermutations);

    return !isEmpty(matches);
};

export { isComponent, isPrimaryComponent };
