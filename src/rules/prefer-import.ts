import { RuleName } from "../enums/rule-name";
import { createRule, tryRule } from "../utils/rule-utils";
import type { CaseTransformation } from "../utils/string-utils";
import {
    isPattern,
    transformCase,
    CASE_TRANSFORMATIONS,
} from "../utils/string-utils";
import {
    arrify,
    difference,
    firstIfOnly,
    first,
    flatten,
    intersection,
    last,
} from "../utils/collection-utils";
import { cloneDeepJson, isEmpty, isString } from "../utils/core-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import {
    getImportSpecifierText,
    getModuleSpecifier,
    getName,
    isIdentifier,
    isImportSpecifier,
    toDefaultImportDeclaration,
    toImportDeclaration,
} from "../utils/node-utils";
import { minimatch } from "minimatch";
import {
    insertTextAfter,
    insertTextBefore,
    insertTextBeforeRange,
    remove,
    removeImportClause,
} from "../utils/fixer-utils";
import { getValues, iterate, updateIn } from "../utils/map-utils";
import type {
    RuleContext,
    RuleFix,
    RuleListener,
} from "@typescript-eslint/utils/ts-eslint";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

interface PreferImportOptions {
    [moduleSpecifier: string]: ImportRule | ImportRule[];
}

interface ImportRule {
    /**
     * Import name or list of names to match and replace with preferred module imports. Can also be a wildcard ('*') to match any import from the `moduleSpecifier`, or a glob pattern ('Modal*'), using `minimatch` for pattern matching.
     */
    importName: string[] | string;

    /**
     * Import props from a module of the same canonical name, i.e. `import { AlertProps } from '@twilio-paste/core/alert';` instead of from `'@twilio-paste/core/alert-props'`
     * @default true
     */
    importPropsFromSameModule?: boolean;

    /**
     * Use a default import for replacement instead of a named import.
     * @default false
     */
    replaceAsDefault?: boolean;

    /**
     * Destination module to replace imports with. A reference to the matched import name can be used with the variable `{importName}`, e.g. 'lodash/{importName}'
     */
    replacementModuleSpecifier: string;

    /**
     * String transformation method to be run on the matched `importName`. Only applicable if `replacementModuleSpecifier` has the replacement variable `{importName}`.
     */
    transformImportName?: CaseTransformation;
}

type PreferImportMessageIds =
    | "bannedGlobalType"
    | "preferImport"
    | "preferImportMultiple";

type ErrorMessageReplacementData = Pick<
    ImportRule,
    "importName" | "replacementModuleSpecifier"
>;

type ImportRuleErrors = Map<
    TSESTree.ImportDeclaration,
    Map<ImportRule, TSESTree.ImportSpecifier[]>
>;

const DEFAULT_IMPORT_RULE = {
    importPropsFromSameModule: true,
    replaceAsDefault: false,
};
const IMPORT_NAME_VARIABLE = "{importName}";
const PROGRAM_EXIT = "Program:exit";
const PROPS = "Props";

const create = (
    context: RuleContext<PreferImportMessageIds, PreferImportOptions[]>
): RuleListener => {
    const options = assignDefaultOptions(first(context.options));
    const sourceCode = context.getSourceCode();
    if (isEmpty(options)) {
        return {};
    }

    const importDeclarations: TSESTree.ImportDeclaration[] = [];
    const typeIdentifiers: TSESTree.Identifier[] = [];
    const globalReferences: Array<[name: string, node: TSESTree.Node]> = [];
    const seenGlobalReferences: Set<TSESTree.Node> = new Set();
    const interfaceDeclarations: TSESTree.TSInterfaceDeclaration[] = [];
    const typeDeclarations: TSESTree.TSTypeAliasDeclaration[] = [];
    const variableNames: Set<string> = new Set();

    const errors: ImportRuleErrors = new Map();

    const getImportDeclarationForIdentifier = (
        identifier: TSESTree.Identifier | string
    ): TSESTree.ImportDeclaration | undefined => {
        const name = isString(identifier) ? identifier : identifier.name;
        return importDeclarations.find((importDeclaration) =>
            importDeclaration.specifiers
                .filter(isImportSpecifier)
                .some((specifier) => specifier.local.name === name)
        );
    };

    const checkGlobalTypeReferences = () => {
        if (!("global" in options)) {
            return;
        }

        const rules = arrify(options.global);
        if (isEmpty(rules)) {
            return;
        }

        const checkReference = (name: string, node: TSESTree.Node) => {
            rules.forEach((rule) => {
                const importNames = arrify(rule.importName);
                if (!importNames.includes(name)) {
                    return;
                }

                const importDeclaration =
                    getImportDeclarationForIdentifier(name);

                const typeDeclaration = typeDeclarations.find(
                    (typeDeclaration) => typeDeclaration.id.name === name
                );
                const interfaceDeclaration = interfaceDeclarations.find(
                    (interfaceDeclaration) =>
                        interfaceDeclaration.id.name === name
                );

                if (
                    importDeclaration !== undefined ||
                    typeDeclaration !== undefined ||
                    interfaceDeclaration !== undefined ||
                    variableNames.has(name)
                ) {
                    return;
                }

                const fixes: RuleFix[] = [];

                const replacementModuleSpecifier =
                    getReplacementModuleSpecifier(rule);

                const replacementData: ErrorMessageReplacementData = {
                    importName: name,
                    replacementModuleSpecifier,
                };

                const lastImportDeclaration = last(importDeclarations);
                const replacementImportDeclaration =
                    getReplacementImportDeclarations([name], rule);

                if (lastImportDeclaration !== undefined) {
                    fixes.push(
                        insertTextAfter(
                            lastImportDeclaration,
                            `\n${replacementImportDeclaration}`
                        )
                    );
                }

                if (lastImportDeclaration === undefined) {
                    fixes.push(
                        insertTextBeforeRange(
                            [0, 0],
                            `${replacementImportDeclaration}\n`
                        )
                    );
                }

                context.report({
                    node,
                    messageId: "bannedGlobalType",
                    data: replacementData,
                    fix: () => fixes,
                });
            });
        };

        typeIdentifiers.forEach((identifier) =>
            checkReference(identifier.name, identifier)
        );
        globalReferences.forEach(([name, node]) => checkReference(name, node));
    };

    return {
        TSClassImplements(node) {
            if (isIdentifier(node.expression)) {
                typeIdentifiers.push(node.expression);
            }
        },
        TSTypeReference(node) {
            if (isIdentifier(node.typeName)) {
                typeIdentifiers.push(node.typeName);
            }
        },
        TSInterfaceHeritage(node) {
            if (isIdentifier(node.expression)) {
                typeIdentifiers.push(node.expression);
            }
        },
        MemberExpression(node) {
            if (isIdentifier(node.object)) {
                globalReferences.push([node.object.name, node.object]);
            }
        },
        JSXOpeningElement(node) {
            const jsxElementName = getName(node.name);
            if (jsxElementName != null && !seenGlobalReferences.has(node)) {
                globalReferences.push([jsxElementName, node]);
                seenGlobalReferences.add(node);
            }
        },
        ImportDeclaration(node) {
            importDeclarations.push(node);
        },
        VariableDeclarator(node) {
            if (isIdentifier(node.id)) {
                variableNames.add(node.id.name);
            }
        },
        TSInterfaceDeclaration(node) {
            interfaceDeclarations.push(node);
        },
        TSTypeAliasDeclaration(node) {
            typeDeclarations.push(node);
        },
        [PROGRAM_EXIT]() {
            tryRule(context, () => {
                checkGlobalTypeReferences();

                importDeclarations.forEach((importDeclaration) => {
                    const moduleSpecifier =
                        getModuleSpecifier(importDeclaration);
                    if (options[moduleSpecifier] == null) {
                        return;
                    }

                    const rules = arrify(options[moduleSpecifier]);
                    if (isEmpty(rules)) {
                        return;
                    }

                    rules.forEach((rule) => {
                        const importNames = arrify(rule.importName);
                        const matchingSpecifiers = getMatchingSpecifiers(
                            importDeclaration,
                            importNames
                        );

                        if (isEmpty(matchingSpecifiers)) {
                            return;
                        }

                        updateIn(errors, importDeclaration, (errorsByImport) =>
                            (
                                errorsByImport ??
                                new Map<
                                    ImportRule,
                                    TSESTree.ImportSpecifier[]
                                >()
                            ).set(rule, matchingSpecifiers)
                        );
                    });
                });

                iterate(errors, (importDeclaration, errorsByImport) => {
                    // Keep track of all of the specifiers that are marked as errors by the import
                    // Since specifiers can be matched multiple times by wildcard/glob patterns,
                    // we only want to take the first match (which should be the most specific)
                    // and remove it from the collection when we rebuild the import list
                    let specifiersMarkedAsError: TSESTree.ImportSpecifier[] =
                        flatten(getValues(errorsByImport));
                    const replacementData: ErrorMessageReplacementData[] = [];

                    const fixes: RuleFix[] = [];

                    const shouldRemoveEntireImport =
                        importDeclaration.specifiers.length <=
                        specifiersMarkedAsError.length;

                    if (shouldRemoveEntireImport) {
                        fixes.push(remove(importDeclaration));
                    }

                    if (!shouldRemoveEntireImport) {
                        fixes.push(
                            ...specifiersMarkedAsError.flatMap(
                                removeImportClause(sourceCode)
                            )
                        );
                    }

                    iterate(errorsByImport, (rule, specifiersByRule) => {
                        const {
                            replaceAsDefault = DEFAULT_IMPORT_RULE.replaceAsDefault,
                            replacementModuleSpecifier,
                        } = rule;
                        const remainingSpecifiersToFix = intersection(
                            specifiersByRule,
                            specifiersMarkedAsError
                        );

                        if (isEmpty(remainingSpecifiersToFix)) {
                            return;
                        }

                        const hasPotentiallyMultipleImports =
                            replaceAsDefault ||
                            hasImportNameVariable(replacementModuleSpecifier);
                        if (hasPotentiallyMultipleImports) {
                            const replacementsByModuleSpecifier = new Map<
                                string,
                                string[]
                            >();
                            remainingSpecifiersToFix.forEach((specifier) => {
                                const importName = getName(specifier) ?? "";
                                const replacementModuleSpecifier =
                                    getReplacementModuleSpecifier(
                                        rule,
                                        specifier
                                    );

                                const importNames =
                                    replacementsByModuleSpecifier.get(
                                        replacementModuleSpecifier
                                    ) ?? [];

                                if (!importNames.includes(importName)) {
                                    importNames.push(importName);
                                }
                                replacementsByModuleSpecifier.set(
                                    replacementModuleSpecifier,
                                    importNames
                                );
                            });

                            iterate(
                                replacementsByModuleSpecifier,
                                (replacementModuleSpecifier, importNames) =>
                                    replacementData.push({
                                        importName: importNames.join(", "),
                                        replacementModuleSpecifier,
                                    })
                            );
                        }

                        if (!hasPotentiallyMultipleImports) {
                            replacementData.push({
                                importName: remainingSpecifiersToFix
                                    .map(getName)
                                    .join(", "),
                                replacementModuleSpecifier:
                                    getReplacementModuleSpecifier(
                                        rule,
                                        firstIfOnly(remainingSpecifiersToFix)
                                    ),
                            });
                        }

                        specifiersMarkedAsError = difference(
                            specifiersMarkedAsError,
                            remainingSpecifiersToFix
                        );

                        fixes.push(
                            insertTextBefore(
                                importDeclaration,
                                getReplacementImportDeclarations(
                                    remainingSpecifiersToFix,
                                    rule
                                )
                            )
                        );
                    });

                    const hasMultipleErrors = replacementData.length > 1;
                    context.report({
                        node: importDeclaration,
                        messageId: hasMultipleErrors
                            ? "preferImportMultiple"
                            : "preferImport",
                        data: hasMultipleErrors
                            ? {
                                  message:
                                      getMultipleErrorReplacementString(
                                          replacementData
                                      ),
                              }
                            : firstIfOnly(replacementData),
                        fix: () => fixes,
                    });
                });
            });
        },
    };
};

const importRuleSchema: JSONSchema4 = {
    type: "object",
    properties: {
        importName: {
            description:
                "Import name or list of names to match and replace with preferred module imports. Can also be a wildcard ('*') to match any import from the `moduleSpecifier`, or a glob pattern ('Modal*'), using `minimatch` for pattern matching.",
            oneOf: [
                {
                    type: "string",
                },
                {
                    type: "array",
                    items: [{ type: "string" }],
                },
            ],
        },
        importPropsFromSameModule: {
            description:
                "Import props from a module of the same canonical name, i.e. `import { AlertProps } from '@twilio-paste/core/alert';` instead of from '@twilio-paste/core/alert-props'",
            type: "boolean",
        },
        replacementModuleSpecifier: {
            description:
                "Destination module to replace imports with. A reference to the matched import name can be used with the variable `{importName}`, e.g. 'lodash/{importName}'",
            type: "string",
        },
        replaceAsDefault: {
            description:
                "Use a default import for replacement instead of a named import.",
            type: "boolean",
        },
        transformImportName: {
            description:
                "String transformation method to be run on the matched `importName`. Only applicable if `replacementModuleSpecifier` has the replacement variable `{importName}`.",
            enum: CASE_TRANSFORMATIONS,
            type: "string",
        },
    },
};

const preferImport = createRule<PreferImportOptions[], PreferImportMessageIds>({
    meta: {
        type: "problem",
        fixable: "code",
        docs: {
            description:
                "Enforces imports from a preferred module over another, such as for tree-shaking purposes or wrapping a library.",
        },
        messages: {
            bannedGlobalType:
                "The type '{{importName}}' is currently being referenced as a global type, but should be imported from '{{replacementModuleSpecifier}}' instead.",
            preferImport:
                "Import '{{importName}}' from '{{replacementModuleSpecifier}}' instead.",
            preferImportMultiple: "{{message}}",
        },
        schema: {
            type: "array",
            minItems: 1,
            maxItems: 1,
            items: [
                {
                    type: "object",
                    description:
                        "Configuration object where the key is the module specifier and the values are import patterns to replace",
                    additionalProperties: {
                        oneOf: [
                            importRuleSchema,
                            {
                                type: "array",
                                items: [importRuleSchema],
                                minItems: 1,
                            },
                        ],
                    },
                },
            ],
        },
    },
    defaultOptions: [],
    name: RuleName.PreferImport,
    create,
});

const assignDefaultOptions = (
    options: PreferImportOptions | undefined
): PreferImportOptions => {
    if (options == null) {
        return {};
    }

    // Options from ESLint are read-only, so we need to clone this object
    const updatedOptions = cloneDeepJson(options);
    Object.keys(updatedOptions).forEach((key) => {
        updatedOptions[key] = arrify(updatedOptions[key]).map((rule) =>
            Object.assign({ ...DEFAULT_IMPORT_RULE }, rule)
        );
    });

    return updatedOptions;
};

const getMatchingSpecifiers = (
    importDeclaration: TSESTree.ImportDeclaration,
    importNames: string[]
): TSESTree.ImportSpecifier[] => {
    const specifiers = importDeclaration.specifiers.filter(isImportSpecifier);
    const matchingSpecifiers = specifiers.filter((specifier) =>
        importNames.some((importName) => {
            const name = getName(specifier) ?? "";
            if (isPattern(importName)) {
                return minimatch(name, importName);
            }

            return importName === name;
        })
    );

    return matchingSpecifiers;
};

const getReplacementImportDeclarations = (
    specifiers: string[] | TSESTree.ImportSpecifier[],
    rule: ImportRule
): string => {
    const {
        replaceAsDefault = DEFAULT_IMPORT_RULE.replaceAsDefault,
        replacementModuleSpecifier,
    } = rule;

    if (replaceAsDefault || hasImportNameVariable(replacementModuleSpecifier)) {
        return specifiers
            .map((specifier) => {
                const alias = isString(specifier)
                    ? specifier
                    : specifier.local.name;
                // Prefer the alias name if present & replacing as a default import, otherwise
                // we can produce broken code such as `import isEmpty as lodashIsEmpty from 'lodash/isEmpty'`
                const useAliasAsName =
                    !isEmpty(alias) && !isString(specifier) && replaceAsDefault;
                const name = useAliasAsName
                    ? alias
                    : getImportSpecifierText(specifier) ?? "";
                const moduleSpecifier = getReplacementModuleSpecifier(
                    rule,
                    specifier
                );

                return replaceAsDefault
                    ? toDefaultImportDeclaration(name, moduleSpecifier)
                    : toImportDeclaration(name, moduleSpecifier);
            })
            .join("\n");
    }

    const moduleSpecifier = getReplacementModuleSpecifier(
        rule,
        firstIfOnly<TSESTree.ImportSpecifier | string>(specifiers)
    );

    const importNames = specifiers.map(getImportSpecifierText) as string[];
    return `${toImportDeclaration(importNames, moduleSpecifier)}\n`;
};

const getReplacementModuleSpecifier = (
    rule: ImportRule,
    specifier?: TSESTree.ImportSpecifier | string
): string => {
    const {
        replacementModuleSpecifier,
        transformImportName,
        importPropsFromSameModule = DEFAULT_IMPORT_RULE.importPropsFromSameModule,
    } = rule;
    let moduleSpecifier = replacementModuleSpecifier;

    if (
        hasImportNameVariable(replacementModuleSpecifier) &&
        specifier != null
    ) {
        let importName = isString(specifier)
            ? specifier
            : getName(specifier) ?? "";
        const shouldReplaceProps =
            importName.endsWith(PROPS) && importPropsFromSameModule;

        if (shouldReplaceProps) {
            importName = importName.slice(0, importName.lastIndexOf(PROPS));
        }

        importName = transformCase(importName, transformImportName);

        moduleSpecifier = replacementModuleSpecifier.replace(
            IMPORT_NAME_VARIABLE,
            importName
        );
    }

    return moduleSpecifier;
};

/**
 * Constructs the error message for an ImportDeclaration that has multiple imports + module specifiers
 * for replacement, which is too complex for ESLint's variable substitution to do alone.
 */
const getMultipleErrorReplacementString = (
    replacementData: ErrorMessageReplacementData[]
): string =>
    replacementData
        .map((data) => {
            const { importName, replacementModuleSpecifier } = data;
            const isFirst = data === first(replacementData);
            const isLast = data === last(replacementData);

            let introText = isFirst ? "Import" : "";
            if (isLast) {
                introText = " and";
            }

            return `${introText} ${arrify(importName)
                .map((name) => `'${name}'`)
                .join()} from '${replacementModuleSpecifier}'${
                isLast ? "." : ","
            }`;
        })
        .join("");

const hasImportNameVariable = (replacementModuleSpecifier: string) =>
    replacementModuleSpecifier.includes(IMPORT_NAME_VARIABLE);

export type { PreferImportOptions };
export { preferImport };
