import { LODASH_IMPORTS } from "./constants/lodash-imports";
import { TWILIO_PASTE_IMPORTS } from "./constants/twilio-paste-imports";
import { RuleName } from "./enums/rule-name";
import { groupExports } from "./rules/group-exports";
import { noDefaultExport } from "./rules/no-default-export";
import { noInlineExport } from "./rules/no-inline-export";
import { preferImport } from "./rules/prefer-import";
import { preferNativePrivateSyntax } from "./rules/prefer-native-private-syntax";
import { sortDependencyList } from "./rules/sort-dependency-list";
import { sortExports } from "./rules/sort-exports";

const preferImportLodash = {
    plugins: ["collation"],
    rules: {
        "collation/prefer-import": ["warn", LODASH_IMPORTS],
    },
};

const preferImportTwilioPaste = {
    plugins: ["collation"],
    rules: {
        "collation/prefer-import": ["warn", TWILIO_PASTE_IMPORTS],
    },
};

const recommended = {
    plugins: ["collation"],
    rules: {
        "collation/group-exports": "warn",
        "collation/no-default-export": "warn",
        "collation/no-inline-export": "warn",
        "collation/sort-dependency-list": "warn",
        "collation/sort-exports": "warn",
    },
};

const strict = {
    plugins: ["collation"],
    rules: {
        "collation/group-exports": "error",
        "collation/no-default-export": "error",
        "collation/no-inline-export": "error",
        "collation/sort-dependency-list": "error",
        "collation/sort-exports": "error",
    },
};

const configs = {
    "prefer-import.lodash": preferImportLodash,
    "prefer-import.@twilio-paste": preferImportTwilioPaste,
    recommended,
    strict,
};

const rules = {
    [RuleName.GroupExports]: groupExports,
    [RuleName.NoDefaultExport]: noDefaultExport,
    [RuleName.NoInlineExport]: noInlineExport,
    [RuleName.PreferImport]: preferImport,
    [RuleName.PreferNativePrivateSyntax]: preferNativePrivateSyntax,
    [RuleName.SortDependencyList]: sortDependencyList,
    [RuleName.SortExports]: sortExports,
};

export { configs, rules };
