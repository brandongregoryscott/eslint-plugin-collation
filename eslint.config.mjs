import { defineConfig } from "eslint/config";
import tsEslint from "typescript-eslint";
import collationPlugin from "eslint-plugin-collation";
import importPlugin from "eslint-plugin-import";
import tsSortKeysPlugin from "eslint-plugin-typescript-sort-keys";
import stylisticPlugin from "@stylistic/eslint-plugin";

const config = defineConfig(tsEslint.configs.recommended, {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: {
            project: "./tsconfig.json",
        },
    },
    plugins: {
        "@stylistic": stylisticPlugin,
        "@typescript-eslint": tsEslint.plugin,
        collation: collationPlugin,
        import: importPlugin,
        "typescript-sort-keys": tsSortKeysPlugin,
    },
    rules: {
        "@stylistic/padding-line-between-statements": [
            "error",
            {
                blankLine: "always",
                next: "export",
                prev: "*",
            },
            {
                blankLine: "never",
                next: "export",
                prev: "export",
            },
            {
                blankLine: "always",
                next: "*",
                prev: "import",
            },
            {
                blankLine: "never",
                next: "import",
                prev: "import",
            },
        ],
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/consistent-type-exports": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/strict-boolean-expressions": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "collation/group-exports": "error",
        "collation/no-default-export": "error",
        "collation/no-inline-export": "error",
        "collation/sort-exports": "error",
        curly: "error",
        eqeqeq: [
            "error",
            "always",
            {
                null: "ignore",
            },
        ],
        "import/no-duplicates": "error",
        "no-console": "error",
        "typescript-sort-keys/interface": [
            "error",
            "asc",
            {
                caseSensitive: false,
            },
        ],
        "typescript-sort-keys/string-enum": "error",
    },
});

export default config;
