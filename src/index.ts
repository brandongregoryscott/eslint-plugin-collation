import { RuleName } from "./enums/rule-name";
import { noDefaultExport } from "./rules/no-default-export";
import { sortDependencyList } from "./rules/sort-dependency-list";

const configs = {
    recommended: {
        plugins: ["collation"],
        rules: {
            "collation/no-default-export": "warn",
            "collation/sort-dependency-list": "warn",
        },
    },
    strict: {
        plugins: ["collation"],
        rules: {
            "collation/no-default-export": "error",
            "collation/sort-dependency-list": "error",
        },
    },
};

const rules = {
    [RuleName.NoDefaultExport]: noDefaultExport,
    [RuleName.SortDependencyList]: sortDependencyList,
};

export { configs, rules };
