import type {
    RuleContext,
    RuleFix,
    RuleListener,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { createRule, tryRule } from "../utils/rule-utils";
import type { CaseTransformation } from "../utils/string-utils";
import {
    isPattern,
    transformCase,
    CASE_TRANSFORMATIONS,
} from "../utils/string-utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";
import {
    arrify,
    difference,
    firstIfOnly,
    first,
    flatten,
    intersection,
} from "../utils/collection-utils";
import { cloneDeepJson, isEmpty } from "../utils/core-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import {
    getImportSpecifierText,
    getModuleSpecifier,
    getName,
    isImportSpecifier,
    toDefaultImportDeclaration,
    toImportDeclaration,
} from "../utils/node-utils";
import { minimatch } from "minimatch";
import {
    insertTextBefore,
    remove,
    removeImportClause,
} from "../utils/fixer-utils";
import { getValues, iterate, updateIn } from "../utils/map-utils";

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

type PreferImportMessageIds = "preferImport";

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
    const errors: ImportRuleErrors = new Map();

    return {
        ImportDeclaration(importDeclaration) {
            tryRule(context, () => {
                const moduleSpecifier = getModuleSpecifier(importDeclaration);
                if (options[moduleSpecifier] == null) {
                    return;
                }

                const rules = arrify(options[moduleSpecifier]);
                if (isEmpty(rules)) {
                    return;
                }

                importDeclarations.push(importDeclaration);
            });
        },
        [PROGRAM_EXIT]() {
            tryRule(context, () => {
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
                        const remainingSpecifiersToFix = intersection(
                            specifiersByRule,
                            specifiersMarkedAsError
                        );

                        if (isEmpty(remainingSpecifiersToFix)) {
                            return;
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

                    context.report({
                        node: importDeclaration,
                        messageId: "preferImport",
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
        },
    },
};

const preferImport = createRule<PreferImportOptions[], PreferImportMessageIds>({
    meta: {
        type: "problem",
        fixable: "code",
        docs: {
            description:
                "Enforces imports from a preferred module, i.e. for wrapped library functionality or ESM-friendly packages",
            recommended: "error",
        },
        messages: {
            preferImport:
                "Import '{{importName}}' from '{{moduleSpecifier}}' instead.",
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
    specifiers: TSESTree.ImportSpecifier[],
    rule: ImportRule
): string => {
    const {
        replaceAsDefault = DEFAULT_IMPORT_RULE.replaceAsDefault,
        replacementModuleSpecifier,
    } = rule;

    if (
        replaceAsDefault ||
        replacementModuleSpecifier.includes(IMPORT_NAME_VARIABLE)
    ) {
        return specifiers
            .map((specifier) => {
                const name = getImportSpecifierText(specifier) ?? "";
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
        firstIfOnly(specifiers)
    );

    const importNames = specifiers.map(getImportSpecifierText) as string[];
    return `${toImportDeclaration(importNames, moduleSpecifier)}\n`;
};

const getReplacementModuleSpecifier = (
    rule: ImportRule,
    specifier?: TSESTree.ImportSpecifier
): string => {
    const {
        replacementModuleSpecifier,
        transformImportName,
        importPropsFromSameModule = DEFAULT_IMPORT_RULE.importPropsFromSameModule,
    } = rule;
    let moduleSpecifier = replacementModuleSpecifier;

    if (
        replacementModuleSpecifier.includes(IMPORT_NAME_VARIABLE) &&
        specifier != null
    ) {
        let importName = getImportSpecifierText(specifier) ?? "";
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

export type { PreferImportOptions };
export { preferImport };
