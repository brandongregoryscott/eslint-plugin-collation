import { ESLintUtils } from "@typescript-eslint/utils";
import { noDefaultExport } from "./no-default-export";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
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
