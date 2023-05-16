import { createRule, tryRule } from "../utils/rule-utils";
import { RuleName } from "../enums/rule-name";
import type {
    RuleContext,
    RuleFix,
    RuleListener,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { getName } from "../utils/node-utils";
import { isEmpty } from "../utils/core-utils";
import {
    insertTextBefore,
    replaceIdentifier,
    replaceText,
} from "../utils/fixer-utils";
import type { CaseStyle } from "../utils/string-utils";
import {
    getBasenameWithoutExtension,
    getDirectoryName,
    changeCase,
} from "../utils/string-utils";
import camelCase from "lodash/camelCase";
import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { first } from "../utils/collection-utils";
import { PROGRAM_EXIT } from "../constants/eslint";

type DefaultExportMatchesFilenameMessageIds =
    | "defaultExportDoesNotMatchFilename"
    | "defaultExportMissingName";

const EXPORT_CASE_STYLES: CaseStyle[] = [
    "camel-case",
    "title-case",
    "constant-case",
];

const INDEX = "index";

const create = (
    context: RuleContext<DefaultExportMatchesFilenameMessageIds, never[]>
): RuleListener => {
    let filename = getBasenameWithoutExtension(context.getFilename());
    if (filename === INDEX) {
        filename = getDirectoryName(context.getFilename());
    }

    const useFilenameForExport = isEmpty(filename.match(/[\-_ ]/));
    const sourceCode = context.getSourceCode();

    const identifiers: TSESTree.Identifier[] = [];
    let exportDefaultDeclaration:
        | TSESTree.ExportDefaultDeclaration
        | undefined = undefined;

    return {
        Identifier: (node) => {
            identifiers.push(node);
        },
        ExportDefaultDeclaration: (node) => {
            exportDefaultDeclaration = node;
        },
        [PROGRAM_EXIT]() {
            if (shouldSkipFile(context, exportDefaultDeclaration)) {
                return;
            }

            tryRule(context, () => {
                const node =
                    exportDefaultDeclaration as TSESTree.ExportDefaultDeclaration;
                const name = getName(node);

                if (isEmpty(name)) {
                    const fixes: RuleFix[] = [];
                    const expectedName = useFilenameForExport
                        ? filename
                        : camelCase(filename);

                    const shouldAddVariableDeclaration = [
                        AST_NODE_TYPES.Literal,
                        AST_NODE_TYPES.ArrayExpression,
                        AST_NODE_TYPES.ObjectExpression,
                        AST_NODE_TYPES.ArrowFunctionExpression,
                    ].includes(node.declaration.type);

                    const shouldMoveDeclaration = [
                        AST_NODE_TYPES.ClassDeclaration,
                        AST_NODE_TYPES.FunctionDeclaration,
                    ].includes(node.declaration.type);

                    const value = sourceCode
                        .getText(node)
                        .replace("export default", "")
                        .trim();

                    if (shouldAddVariableDeclaration) {
                        const variableDeclaration = `const ${expectedName} = ${value}\n`;

                        fixes.push(insertTextBefore(node, variableDeclaration));
                    }

                    if (shouldMoveDeclaration) {
                        const type =
                            node.declaration.type ===
                            AST_NODE_TYPES.FunctionDeclaration
                                ? "function"
                                : "class";
                        const namedDeclaration = `${value.replace(
                            type,
                            `${type} ${expectedName}`
                        )}\n`;

                        fixes.push(insertTextBefore(node, namedDeclaration));
                    }

                    fixes.push(
                        replaceText(node, `export default ${expectedName}`)
                    );
                    context.report({
                        node,
                        messageId: "defaultExportMissingName",
                        data: {
                            name: expectedName,
                        },
                        fix: () => fixes,
                    });
                    return;
                }

                let validNames = EXPORT_CASE_STYLES.map((caseStyle) =>
                    changeCase(filename, caseStyle)
                );
                if (useFilenameForExport && !validNames.includes(filename)) {
                    validNames = [...validNames, filename];
                }

                const replacementName = useFilenameForExport
                    ? filename
                    : (first(validNames) as string);

                if (validNames.includes(name)) {
                    return;
                }

                const fixes = identifiers
                    .filter((identifier) => getName(identifier) === name)
                    .map((identifier) =>
                        replaceIdentifier(identifier, replacementName)
                    );

                context.report({
                    node,
                    messageId: "defaultExportDoesNotMatchFilename",
                    data: {
                        names: validNames
                            .map((matchingName) => `'${matchingName}'`)
                            .join(", "),
                    },
                    fix: () => fixes,
                });
            });
        },
    };
};

const defaultExportMatchesFilename = createRule<
    never[],
    DefaultExportMatchesFilenameMessageIds
>({
    name: RuleName.DefaultExportMatchesFilename,
    defaultOptions: [],
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce default export matches the filename",
            recommended: "error",
        },
        fixable: "code",
        schema: [],
        messages: {
            defaultExportMissingName:
                "Default export is missing a name. Expected '{{name}}'",
            defaultExportDoesNotMatchFilename:
                "Default export does not match filename. Expected one of: {{names}}",
        },
    },
    create,
});

const shouldSkipFile = (
    context: RuleContext<DefaultExportMatchesFilenameMessageIds, never[]>,
    node: TSESTree.ExportDefaultDeclaration | undefined
): boolean => {
    if (context.getFilename().endsWith(".d.ts")) {
        return true;
    }

    if (node == null) {
        return true;
    }

    if (node.declaration.type === AST_NODE_TYPES.CallExpression) {
        return true;
    }

    return false;
};

export { defaultExportMatchesFilename };
