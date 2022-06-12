import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { RuleName } from "../enums/rule-name";
import { findPrimaryComponent, isComponent } from "../utils/component-utils";
import { createRule } from "../utils/rule-utils";
import type {
    RuleContext,
    RuleFix,
    RuleFixer,
} from "@typescript-eslint/utils/dist/ts-eslint";
import type { ComponentType } from "../types/component-type";
import kebabCase from "lodash/kebabCase";
import { getName } from "../utils/node-utils";
import { isEmpty, uniqueId } from "lodash";
import fs from "fs";
import { filterNot } from "../utils/core-utils";
import path from "path";

type MultiCompContext = RuleContext<MultiCompMessageIds, MultiCompOptions>;

type MultiCompOptions = never[];

type MultiCompMessageIds = "extractToSeparateFile" | "multiComp";

const multiComp = createRule<MultiCompOptions, MultiCompMessageIds>({
    create: (context) => {
        const namedExports: TSESTree.ExportNamedDeclaration[] = [];
        const defaultExports: TSESTree.ExportDefaultDeclaration[] = [];
        const declarations: Array<
            | TSESTree.ClassDeclaration
            | TSESTree.FunctionDeclaration
            | TSESTree.VariableDeclaration
        > = [];
        const returnStatements: TSESTree.ReturnStatement[] = [];
        const jsxElements: TSESTree.JSXElement[] = [];

        return {
            ExportDefaultDeclaration: (node): void => {
                defaultExports.push(node);
            },
            ExportNamedDeclaration: (node): void => {
                namedExports.push(node);
            },
            VariableDeclaration: (node): void => {
                declarations.push(node);
            },
            JSXElement: (node): void => {
                jsxElements.push(node);
            },
            ReturnStatement: (node): void => {
                returnStatements.push(node);
            },
            "Program:exit": (): void => {
                const components = declarations.filter((declaration) =>
                    isComponent(declaration, jsxElements, returnStatements)
                );
                if (components.length <= 1) {
                    return;
                }

                const primaryComponent = findPrimaryComponent({
                    components,
                    defaultExports,
                    namedExports,
                    context,
                });
                const reportedComponents = filterNot(
                    components,
                    (component) => component === primaryComponent
                );
                reportedComponents.forEach((component) => {
                    context.report({
                        node: component,
                        messageId: "multiComp",
                        // fix: (fixer) =>
                        //     suggestExtraction(fixer, context, component),
                        suggest: [
                            {
                                messageId: "multiComp",
                                fix: (fixer) =>
                                    suggestExtraction(
                                        fixer,
                                        context,
                                        component
                                    ),
                            },
                        ],
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
        hasSuggestions: true,
        fixable: "code",
        messages: {
            extractToSeparateFile: "Extract this component into a new file",
            multiComp: "Only one component can exist per file",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.MultiComp,
});

const suggestExtraction = (
    fixer: RuleFixer,
    context: MultiCompContext,
    component: ComponentType
): RuleFix | RuleFix[] => {
    const directory = path.dirname(context.getPhysicalFilename?.() ?? "");
    const isTypeScript = context.getFilename().endsWith(".tsx");
    const componentName = getName(component)!;
    if (isEmpty(componentName)) {
        return [];
    }

    const extension = isTypeScript ? ".tsx" : ".js";
    let filename = `${kebabCase(componentName)}${extension}`;

    if (fs.existsSync(path.join(directory, filename))) {
        console.warn(
            `File '${filename}' already exists in the current directory. The extracted file will have a timestamp appended.`
        );
        filename = `${kebabCase(
            `${componentName}-${Math.floor(new Date().getTime() / 1000)}`
        )}${extension}`;
    }

    const sourceCode = context.getSourceCode();
    const fullPath = path.join(directory, filename);

    const fileText = sourceCode.getText(component);
    fs.writeFileSync(fullPath, fileText);
    return [fixer.remove(component)];
};

export type { MultiCompContext };
export { multiComp };
