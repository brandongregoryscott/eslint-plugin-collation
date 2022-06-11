import { TSESTree } from "@typescript-eslint/utils";
import { RuleName } from "../enums/rule-name";
import { isComponent, isPrimaryComponent } from "../utils/component-utils";
import { createRule } from "../utils/rule-utils";
import { RuleFix, RuleFixer } from "@typescript-eslint/utils/dist/ts-eslint";
import { ComponentType } from "../types/component-type";

type MessageIds = "multiComp";

const multiComp = createRule<never[], MessageIds>({
    create: (context) => {
        const namedExports: TSESTree.ExportNamedDeclaration[] = [];
        const defaultExports: TSESTree.ExportDefaultDeclaration[] = [];
        const declarations: Array<
            | TSESTree.VariableDeclaration
            | TSESTree.FunctionDeclaration
            | TSESTree.ClassDeclaration
        > = [];
        const jsxElements: TSESTree.JSXElement[] = [];

        return {
            ExportDefaultDeclaration: (node) => {
                defaultExports.push(node);
            },
            ExportNamedDeclaration: (node) => {
                namedExports.push(node);
            },
            VariableDeclaration: (node) => {
                declarations.push(node);
            },
            JSXElement: (node) => {
                jsxElements.push(node);
            },
            "Program:exit": () => {
                const components = declarations.filter((declaration) =>
                    isComponent(declaration, jsxElements)
                );
                if (components.length <= 1) {
                    return;
                }

                components
                    .filter(
                        (component) =>
                            !isPrimaryComponent(
                                component,
                                components,
                                context,
                                defaultExports,
                                namedExports
                            )
                    )
                    .forEach((component) => {
                        context.report({
                            node: component,
                            messageId: "multiComp",
                            fix: (fixer) => fixMultiComp(fixer, component),
                        });
                    });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "description",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            multiComp: "Only one component can exist per file",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.MultiComp,
});

const fixMultiComp = (
    fixer: RuleFixer,
    component: ComponentType
): RuleFix | RuleFix[] => {
    return [];
};

export { multiComp };
