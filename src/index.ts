import { RuleName } from "./enums/rule-name";
import { groupExports } from "./rules/group-exports";
import { multiComp } from "./rules/multi-comp";
import { noDefaultExport } from "./rules/no-default-export";
import { noInlineExport } from "./rules/no-inline-export";
import { sortDependencyList } from "./rules/sort-dependency-list";

const configs = {
    recommended: {
        parser: "@typescript-eslint/parser",
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
        plugins: ["collation"],
        rules: {
            "collation/group-exports": "warn",
            "collation/multi-comp": "warn",
            "collation/no-default-export": "warn",
            "collation/no-inline-export": "warn",
            "collation/sort-dependency-list": "warn",
        },
    },
    strict: {
        parser: "@typescript-eslint/parser",
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
        plugins: ["collation"],
        rules: {
            "collation/group-exports": "error",
            "collation/multi-comp": "warn",
            "collation/no-default-export": "error",
            "collation/no-inline-export": "error",
            "collation/sort-dependency-list": "error",
        },
    },
};

const rules = {
    [RuleName.GroupExports]: groupExports,
    [RuleName.MultiComp]: multiComp,
    [RuleName.NoDefaultExport]: noDefaultExport,
    [RuleName.NoInlineExport]: noInlineExport,
    [RuleName.SortDependencyList]: sortDependencyList,
};

export { configs, rules };
