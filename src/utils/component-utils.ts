import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import { ComponentType } from "../types/component-type";
import { getName, isChildOf } from "./node-utils";

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
    context: TContext,
    defaultExports: TSESTree.ExportDefaultDeclaration[],
    namedExports: TSESTree.ExportNamedDeclaration[]
): boolean => {
    const componentName = getName(component);
    const isDefaultExport = defaultExports.some(
        (defaultExport) => getName(defaultExport) === componentName
    );
    const filename = context.getFilename().split(".")[0];

    return (
        isDefaultExport ||
        // TODO: Handle kebab-case filenames
        filename.toLowerCase() === componentName?.toLowerCase()
    );
};

export { isComponent, isPrimaryComponent };
