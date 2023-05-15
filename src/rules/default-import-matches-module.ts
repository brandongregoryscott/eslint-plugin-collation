import { createRule } from "../utils/rule-utils";
import { RuleName } from "../enums/rule-name";
import type {
    RuleContext,
    RuleFix,
    RuleListener,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { getName } from "../utils/node-utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { PROGRAM_EXIT } from "../constants/eslint";
import { last } from "../utils/collection-utils";
import { IMPORT_EXPORT_CASE_STYLES } from "../constants/case-styles";
import { changeCase, matchCase } from "../utils/string-utils";
import { isEmpty } from "../utils/core-utils";
import { replaceText } from "../utils/fixer-utils";

type DefaultImportMatchesModuleMessageIds = "defaultImportDoesNotMatchFilename";

const create = (
    context: RuleContext<DefaultImportMatchesModuleMessageIds, never[]>
): RuleListener => {
    const sourceCode = context.getSourceCode();
    const identifiers: TSESTree.Identifier[] = [];
    const importDeclarations: TSESTree.ImportDeclaration[] = [];

    return {
        Identifier: (node) => {
            identifiers.push(node);
        },
        ImportDeclaration: (node) => {
            const hasDefaultImport = node.specifiers.some(
                isDefaultLikeImportSpecifier
            );

            if (!hasDefaultImport) {
                return;
            }
            importDeclarations.push(node);
        },
        [PROGRAM_EXIT]() {
            const report = (
                declaration: TSESTree.ImportDeclaration,
                specifier: TSESTree.ImportClause,
                name: string,
                validNames: string[]
            ): void => {
                const moduleSpecifier = getBaseModuleSpecifier(declaration);
                const moduleSpecifierCase = matchCase(moduleSpecifier);
                const specifierCase = matchCase(name);
                const caseStyle =
                    specifierCase ?? moduleSpecifierCase ?? "camel-case";
                const replacementName = changeCase(moduleSpecifier, caseStyle);
                const fixes: RuleFix[] = identifiers
                    .filter((identifier) => getName(identifier) === name)
                    .map((identifier) =>
                        replaceText(identifier, replacementName)
                    );

                context.report({
                    node: specifier,
                    data: {
                        names: validNames
                            .map((validName) => `'${validName}'`)
                            .join(", "),
                    },
                    messageId: "defaultImportDoesNotMatchFilename",
                    fix: () => fixes,
                });
            };

            importDeclarations.forEach((node) => {
                const specifier = node.specifiers.find(
                    isDefaultLikeImportSpecifier
                );

                if (specifier == null) {
                    return;
                }

                const moduleSpecifier = getBaseModuleSpecifier(node);
                // For named default imports, e.g. { default as StringUtils } take the local name
                // of the specifier instead of the imported name, so we don't rename 'default'
                const name = isDefaultNamedImport(specifier)
                    ? specifier.local.name
                    : getName(specifier);

                if (isEmpty(moduleSpecifier) || isEmpty(name)) {
                    return;
                }

                const validNames = IMPORT_EXPORT_CASE_STYLES.map((caseStyle) =>
                    changeCase(moduleSpecifier, caseStyle)
                );

                if (validNames.includes(name)) {
                    return;
                }

                report(node, specifier, name, validNames);
            });
        },
    };
};

const defaultImportMatchesModule = createRule<
    never[],
    DefaultImportMatchesModuleMessageIds
>({
    name: RuleName.DefaultImportMatchesModule,
    defaultOptions: [],
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce default import matches the filename",
            recommended: "error",
        },
        fixable: "code",
        schema: [],
        messages: {
            defaultImportDoesNotMatchFilename:
                "Default import does not match filename. Expected one of: {{names}}",
        },
    },
    create,
});

const isDefaultLikeImportSpecifier = (
    importClause: TSESTree.ImportClause
): boolean =>
    isDefaultImportSpecifier(importClause) ||
    isNamespaceImportSpecifier(importClause) ||
    isDefaultNamedImport(importClause);

const isDefaultImportSpecifier = (
    importClause: TSESTree.ImportClause
): importClause is TSESTree.ImportDefaultSpecifier =>
    importClause.type === AST_NODE_TYPES.ImportDefaultSpecifier;

const isNamespaceImportSpecifier = (
    importClause: TSESTree.ImportClause
): importClause is TSESTree.ImportNamespaceSpecifier =>
    importClause.type === AST_NODE_TYPES.ImportNamespaceSpecifier;

const isDefaultNamedImport = (
    importClause: TSESTree.ImportClause
): importClause is TSESTree.ImportSpecifier =>
    importClause.type === AST_NODE_TYPES.ImportSpecifier &&
    importClause.imported.name === "default";

const getBaseModuleSpecifier = (node: TSESTree.ImportDeclaration): string =>
    last(node.source.value.split("/")) ?? "";

export { defaultImportMatchesModule };
