import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import type { ComponentType } from "../types/component-type";
import first from "lodash/first";
import { getExportSpecifiers, getName, isChildOf } from "./node-utils";
import isEmpty from "lodash/isEmpty";
import camelCase from "lodash/camelCase";
import lowerCase from "lodash/lowerCase";
import kebabCase from "lodash/kebabCase";
import snakeCase from "lodash/snakeCase";
import intersection from "lodash/intersection";
import takeRight from "lodash/takeRight";
import intersectionWith from "lodash/intersectionWith";

interface FindPrimaryComponentOptions<
    TContext extends RuleContext<string, unknown[]>
> {
    components: ComponentType[];
    context: TContext;
    defaultExports: TSESTree.ExportDefaultDeclaration[];
    namedExports: TSESTree.ExportNamedDeclaration[];
}

const nameTransformations = [camelCase, lowerCase, kebabCase, snakeCase];

const isComponent = (
    declaration: ComponentType,
    jsxElements: TSESTree.JSXElement[],
    returnStatements: TSESTree.ReturnStatement[]
): boolean => {
    const returnStatement = returnStatements.find((returnStatement) =>
        isChildOf(returnStatement, declaration)
    );

    if (returnStatement == null) {
        return false;
    }

    const jsxElement = jsxElements.find((jsxElement) =>
        isChildOf(jsxElement, returnStatement)
    );

    return jsxElement != null;
};

const findPrimaryComponent = <TContext extends RuleContext<string, unknown[]>>(
    options: FindPrimaryComponentOptions<TContext>
): ComponentType => {
    const { components, defaultExports, namedExports, context } = options;

    const defaultExportedComponent = first(
        intersectionWith(
            components,
            defaultExports,
            (component, defaultExport) =>
                getName(component) === getName(defaultExport)
        )
    );

    const baseFilename = first(context.getFilename().split("."))!;
    const componentByFilename = components.find((component) =>
        matchesName(component, baseFilename)
    );

    const directoryName = first(
        takeRight((context.getCwd?.() ?? "").split("/"), 2)
    )!;

    const componentByDirectoryName = components.find((component) =>
        matchesName(component, directoryName)
    );

    const firstExportedComponent = first(
        intersectionWith(components, namedExports, (component, namedExport) => {
            const componentName = getName(component);
            const isExported =
                getExportSpecifiers(namedExport).includes(componentName!) ||
                getName(namedExport) === componentName;

            const isFirstComponent = component === first(components);

            return isExported && isFirstComponent;
        })
    );

    return (
        defaultExportedComponent ??
        componentByFilename ??
        componentByDirectoryName ??
        firstExportedComponent ??
        first(components)!
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

export { isComponent, findPrimaryComponent };
