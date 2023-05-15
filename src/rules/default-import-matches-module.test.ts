import { ESLintUtils } from "@typescript-eslint/utils";
import { defaultImportMatchesModule } from "./default-import-matches-module";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("default-import-matches-module", defaultImportMatchesModule, {
    valid: [
        {
            code: "import foo from 'foo';",
        },
        {
            code: "import List from './list';",
        },
        {
            code: "import CONSTANTS from './constants';",
        },
        {
            code: "import StringUtils from './string-utils';",
        },
        {
            code: "import * as StringUtils from './string-utils';",
        },
        {
            code: "import { default as StringUtils } from './string-utils';",
        },
        {
            code: "import './reset-styles';",
        },
        {
            name: "does not report errors for relative index path",
            code: "import foo from '../';",
        },
    ],
    invalid: [
        {
            code: "import NumberUtils from './string-utils';",
            output: "import StringUtils from './string-utils';",
            errors: [{ messageId: "defaultImportDoesNotMatchFilename" }],
        },
        {
            code: "import * as NumberUtils from './string-utils';",
            output: "import * as StringUtils from './string-utils';",
            errors: [{ messageId: "defaultImportDoesNotMatchFilename" }],
        },
        {
            code: "import { default as NumberUtils } from './string-utils';",
            output: "import { default as StringUtils } from './string-utils';",
            errors: [{ messageId: "defaultImportDoesNotMatchFilename" }],
        },
    ],
});
