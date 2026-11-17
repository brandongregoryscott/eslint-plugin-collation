import { defineConfig } from "eslint/config";
import tsEslint from "typescript-eslint";
import collationPlugin from "eslint-plugin-collation";
import importPlugin from "eslint-plugin-import";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import packageJsonPlugin from "eslint-plugin-package-json";
import * as parserJsonc from "jsonc-eslint-parser";

const DECLARATION_TYPES = [
    "const",
    "let",
    "var",
    "using",
    "type",
    "interface",
    "enum",
    "function",
    "class",
    "function-overload",
];

// Export lists stay grouped; inline exported declarations still need separation.
const EXPORT_LIST = {
    selector: "ExportNamedDeclaration[declaration=null], ExportAllDeclaration",
};

// Callback-based route handlers and event listeners also form readable blocks.
const CALLBACK_BLOCK = {
    selector:
        "ExpressionStatement:has(CallExpression.expression > :matches(ArrowFunctionExpression, FunctionExpression))",
};

// Ordinary local variables may stay grouped; rule order makes this exception
// narrower than the boundaries around uppercase constants and function helpers.
const LOCAL_VARIABLES = {
    selector:
        ":matches(BlockStatement, SwitchCase, StaticBlock) > VariableDeclaration",
};

const UPPERCASE_CONSTANT = {
    selector:
        'VariableDeclaration[kind="const"]:has(VariableDeclarator > Identifier.id[name=/^[A-Z][A-Z0-9_]*$/])',
};

const FUNCTION_VARIABLE = {
    selector:
        "VariableDeclaration:has(VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression).init)",
};

const STATEMENT_PADDING = [
    { blankLine: "always", prev: "*", next: DECLARATION_TYPES },
    { blankLine: "always", prev: DECLARATION_TYPES, next: "*" },
    { blankLine: "any", prev: LOCAL_VARIABLES, next: LOCAL_VARIABLES },
    { blankLine: "always", prev: "*", next: UPPERCASE_CONSTANT },
    { blankLine: "always", prev: UPPERCASE_CONSTANT, next: "*" },
    { blankLine: "always", prev: "*", next: FUNCTION_VARIABLE },
    { blankLine: "always", prev: FUNCTION_VARIABLE, next: "*" },
    { blankLine: "always", prev: "*", next: "block-like" },
    { blankLine: "always", prev: "block-like", next: "*" },
    { blankLine: "always", prev: "*", next: CALLBACK_BLOCK },
    { blankLine: "always", prev: CALLBACK_BLOCK, next: "*" },
    { blankLine: "always", prev: "*", next: "if" },
    { blankLine: "always", prev: "if", next: "*" },
    { blankLine: "always", prev: "*", next: "return" },
    { blankLine: "always", prev: "*", next: "import" },
    { blankLine: "always", prev: "import", next: "*" },
    { blankLine: "never", prev: "import", next: "import" },
    { blankLine: "always", prev: "*", next: "export" },
    { blankLine: "always", prev: "export", next: "*" },
    { blankLine: "never", prev: EXPORT_LIST, next: EXPORT_LIST },
    {
        blankLine: "never",
        prev: "function-overload",
        next: ["function-overload", "function"],
    },
];

// Vitest's padding rules recognize Playwright's test.* calls too.
// Include Node's hook names and Vitest's suite alias as well.
const ADDITIONAL_TEST_BLOCK = {
    selector:
        "ExpressionStatement[expression.callee.name=/^(before|after|suite)$/]",
};

const SPACING = [
    {
        files: ["**/*.{js,mjs,mts,ts,tsx}"],
        plugins: { "@stylistic": stylistic },
        rules: {
            "@stylistic/padding-line-between-statements": [
                "error",
                ...STATEMENT_PADDING,
            ],
            "@stylistic/lines-between-class-members": [
                "error",
                "always",
                { exceptAfterOverload: true },
            ],
            "@stylistic/no-multiple-empty-lines": [
                "error",
                { max: 1, maxBOF: 0, maxEOF: 0 },
            ],
        },
    },
    {
        files: [
            "**/*.{test,spec}.{js,mjs,mts,ts,tsx}",
            "**/{test,tests}/**/*.{js,mjs,mts,ts,tsx}",
        ],
        plugins: { vitest },
        rules: {
            "@stylistic/padding-line-between-statements": [
                "error",
                ...STATEMENT_PADDING,
                { blankLine: "always", prev: "*", next: ADDITIONAL_TEST_BLOCK },
                { blankLine: "always", prev: ADDITIONAL_TEST_BLOCK, next: "*" },
            ],
            "vitest/require-top-level-describe": [
                "error",
                { maxNumberOfTopLevelDescribes: 1 },
            ],
            "vitest/padding-around-describe-blocks": "error",
            "vitest/padding-around-test-blocks": "error",
            "vitest/padding-around-before-all-blocks": "error",
            "vitest/padding-around-before-each-blocks": "error",
            "vitest/padding-around-after-all-blocks": "error",
            "vitest/padding-around-after-each-blocks": "error",
        },
    },
];

const TYPESCRIPT_FILES = ["**/*.{ts,tsx}"];

const CONFIG = defineConfig([
    {
        files: TYPESCRIPT_FILES,
        rules: {
            curly: ["error", "all"],
            eqeqeq: [
                "error",
                "always",
                {
                    null: "ignore",
                },
            ],
            "no-console": "error",
            "no-nested-ternary": "error",
            "no-useless-rename": "error",
            "no-var": "error",
            "prefer-destructuring": [
                "error",
                {
                    array: true,
                    object: true,
                },
            ],
        },
    },
    {
        files: TYPESCRIPT_FILES,
        plugins: {
            "@typescript-eslint": tsEslint.plugin,
        },
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                project: "tsconfig.json",
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "no-public",
                },
            ],
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    // Runtime objects and pseudo-enums need semantic names too.
                    selector: "variable",
                    modifiers: ["const", "global"],
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],
                },
                {
                    selector: "variable",
                    modifiers: ["const", "global"],
                    types: ["boolean", "number", "string", "array"],
                    format: ["UPPER_CASE"],
                },
            ],
            "@typescript-eslint/strict-boolean-expressions": [
                "error",
                {
                    allowNullableObject: false,
                    allowNumber: false,
                    allowString: false,
                },
            ],
        },
    },
    {
        files: TYPESCRIPT_FILES,
        plugins: {
            collation: collationPlugin,
        },
        rules: {
            "collation/group-exports": "error",
            "collation/no-default-export": "error",
            "collation/no-destructured-props-parameter": "error",
            "collation/no-inline-export": "error",
            "collation/no-inline-object-type": "error",
            "collation/prefer-native-private-syntax": "error",
            "collation/sort-dependency-list": "error",
            "collation/sort-exports": "error",
        },
    },
    {
        files: TYPESCRIPT_FILES,
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        extends: [
            reactPlugin.configs.flat.recommended,
            reactHooksPlugin.configs.flat.recommended,
        ],
        rules: {
            "react-hooks/exhaustive-deps": "error",
            "react-hooks/rules-of-hooks": "error",
            "react/display-name": "error",
            "react/hook-use-state": "error",
            "react/jsx-boolean-value": ["error", "always"],
            "react/jsx-handler-names": [
                "error",
                { checkLocalVariables: true, checkInlineFunction: true },
            ],
            "no-restricted-syntax": [
                "error",
                {
                    selector:
                        ":matches(BlockStatement, SwitchCase, StaticBlock) :matches(TSTypeAliasDeclaration, TSInterfaceDeclaration, TSEnumDeclaration)",
                    message:
                        "Declare types, interfaces, and enums at module scope.",
                },
                {
                    selector:
                        'JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer :matches(ArrowFunctionExpression, FunctionExpression, CallExpression[callee.property.name="bind"])',
                    message:
                        "Extract a named handleX event handler before the JSX.",
                },
                {
                    selector:
                        "JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer > Identifier:not([name=/^handle[A-Z]/])",
                    message:
                        "Name local event handlers handleX; forward parent handlers through props.onX.",
                },
            ],
            "react/jsx-no-constructed-context-values": "error",
            "react/jsx-sort-props": "error",
            "react/self-closing-comp": "error",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/no-unescaped-entities": "off",
        },
    },
    ...SPACING,
    {
        files: ["**/*.{js,mjs,mts,ts,tsx}"],
        ignores: [
            "**/*.{test,spec,integration}.{js,mjs,mts,ts,tsx}",
            "**/{test,tests,test-utils}/**",
            "**/*-test-utils.{js,mjs,mts,ts,tsx}",
        ],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "**/test-utils",
                                "**/test-utils/**",
                                "**/*-test-utils",
                                "**/*-test-utils.*",
                            ],
                            message:
                                "Test utilities must only be imported by tests or other test utilities.",
                        },
                    ],
                },
            ],
        },
    },

    {
        files: TYPESCRIPT_FILES,
        plugins: {
            perfectionist: perfectionistPlugin,
        },
        rules: {
            "perfectionist/sort-classes": [
                "error",
                {
                    fallbackSort: { type: "unsorted" },
                    groups: [
                        "readonly-property",
                        "property",
                        "private-property",
                        "constructor",
                        "abstract-method",
                        "static-method",
                        ["get-method", "set-method"],
                        "method",
                        "private-static-method",
                        "private-method",
                    ],
                    ignoreCase: true,
                    newlinesBetween: "ignore",
                    newlinesInside: "ignore",
                    order: "asc",
                    partitionByComment: false,
                    partitionByNewLine: false,
                    specialCharacters: "keep",
                    type: "alphabetical",
                },
            ],
            "perfectionist/sort-exports": "error",
            "perfectionist/sort-imports": ["error", { newlinesBetween: 0 }],
            "perfectionist/sort-interfaces": "error",
            "perfectionist/sort-intersection-types": "error",
            "perfectionist/sort-object-types": "error",
            "perfectionist/sort-objects": "error",
            "perfectionist/sort-switch-case": "error",
            "perfectionist/sort-union-types": "error",
        },
    },
    {
        files: TYPESCRIPT_FILES,
        plugins: {
            import: importPlugin,
        },
        rules: {
            "import/consistent-type-specifier-style": [
                "error",
                "prefer-top-level",
            ],
            "import/no-duplicates": "error",
        },
    },
    {
        files: ["package.json"],
        plugins: {
            "package-json": packageJsonPlugin,
        },
        languageOptions: {
            parser: parserJsonc,
        },
        extends: [packageJsonPlugin.configs.recommended],
        rules: {
            // Keep legacy package resolution so this config loads the published
            // devDependency, rather than self-resolving to an unbuilt dist entry.
            "package-json/require-exports": "off",
            "package-json/restrict-dependency-ranges": [
                "error",
                {
                    forDependencyTypes: ["dependencies", "devDependencies"],
                    rangeType: "pin",
                },
            ],
        },
    },
    { ignores: ["dist", "eslint.config.mjs"] },
]);

export default CONFIG;
