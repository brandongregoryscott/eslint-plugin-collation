import type { PreferImportOptions } from "../rules/prefer-import";

const LODASH_IMPORTS: PreferImportOptions = {
    lodash: {
        importName: "*",
        replaceAsDefault: true,
        replacementModuleSpecifier: "lodash/{importName}",
    },
};

export { LODASH_IMPORTS };
