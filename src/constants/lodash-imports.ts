import type { PreferImportOptions } from "../rules/prefer-import";

const LODASH_IMPORTS: PreferImportOptions = {
    lodash: {
        importName: "*",
        replacementModuleSpecifier: "lodash/{importName}",
        replaceAsDefault: true,
    },
};

export { LODASH_IMPORTS };
