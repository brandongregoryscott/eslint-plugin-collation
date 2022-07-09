import { ESLintUtils } from "@typescript-eslint/utils";
import { defaultExportMatchesFile } from "./default-export-matches-file";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("defaultExportMatchesFile", defaultExportMatchesFile, {
    valid: [
        {
            name: "should not report errors camelCase function name matching camelCase filename",
            filename: "isEmpty.ts",
            code: "export default function isEmpty(value) {}",
        },
        {
            name: "should not report errors camelCase function name matching kebab-case filename",
            filename: "is-empty.ts",
            code: "export default function isEmpty(value) {}",
        },
        {
            name: "should not report errors on anonymous default export (force users to name value first with imports/no-anonymous-default-export)",
            filename: "is-empty.ts",
            code: "export default function (value) {}",
        },
    ],
    invalid: [
        {
            name: "should fix incorrect name to match filename",
            filename: "is-empty.ts",
            code: "export default function foo(value) {}",
            output: "export default function isEmpty(value) {}",
            errors: [{ messageId: "defaultExportMatchesFile" }],
        },
        {
            name: "should fix incorrect casing to match kebab-case filename",
            filename: "is-empty.ts",
            code: "export default function isEMPTY(value) {}",
            output: "export default function isEmpty(value) {}",
            errors: [{ messageId: "defaultExportMatchesFile" }],
        },
    ],
});
