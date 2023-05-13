import { RuleName } from "./enums/rule-name";
import { defaultExportMatchesFilename } from "./rules/default-export-matches-filename";
import { groupExports } from "./rules/group-exports";
import { noDefaultExport } from "./rules/no-default-export";
import { noInlineExport } from "./rules/no-inline-export";
import { preferImport } from "./rules/prefer-import";
import { sortDependencyList } from "./rules/sort-dependency-list";
import { sortExports } from "./rules/sort-exports";

const configs = {
    recommended: {
        plugins: ["collation"],
        rules: {
            "collation/default-export-matches-filename": "warn",
            "collation/group-exports": "warn",
            "collation/no-default-export": "warn",
            "collation/no-inline-export": "warn",
            "collation/sort-dependency-list": "warn",
            "collation/sort-exports": "warn",
        },
    },
    strict: {
        plugins: ["collation"],
        rules: {
            "collation/default-export-matches-filename": "error",
            "collation/group-exports": "error",
            "collation/no-default-export": "error",
            "collation/no-inline-export": "error",
            "collation/sort-dependency-list": "error",
            "collation/sort-exports": "error",
        },
    },
};

const rules = {
    [RuleName.GroupExports]: groupExports,
    [RuleName.DefaultExportMatchesFilename]: defaultExportMatchesFilename,
    [RuleName.NoDefaultExport]: noDefaultExport,
    [RuleName.NoInlineExport]: noInlineExport,
    [RuleName.PreferImport]: preferImport,
    [RuleName.SortDependencyList]: sortDependencyList,
    [RuleName.SortExports]: sortExports,
};

export { configs, rules };
