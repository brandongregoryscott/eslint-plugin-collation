import { RuleTester } from "../test/test-utils";
import { noDefaultExport } from "./no-default-export";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noDefaultExport", noDefaultExport, {
    valid: [
        {
            name: "should not report errors for in-line named export",
            code: "export const noop = () => {};",
        },
        {
            name: "should not report errors for named export group",
            code: "const noop = () => {}; export { noop };",
        },
    ],
    invalid: [
        {
            name: "should fix in-line function default export",
            code: "export default function noop() {};",
            output: "export function noop() {};",
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should fix standalone default export statement",
            code: "const foo = 5; export default foo;",
            output: "export const foo = 5; ",
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should report errors for anonymous function default export",
            code: "export default () => {};",
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should report errors for variable default export",
            code: "export default 5;",
            errors: [{ messageId: "noDefaultExport" }],
        },
    ],
});
