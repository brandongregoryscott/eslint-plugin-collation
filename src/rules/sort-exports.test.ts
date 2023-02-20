import { ESLintUtils } from "@typescript-eslint/utils";
import { stripIndent } from "common-tags";
import { sortExports } from "./sort-exports";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("sortExports", sortExports, {
    valid: [
        {
            name: "should not report errors for single export",
            code: stripIndent`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for export statement with multiple specifiers that are sorted",
            code: stripIndent`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
        },
    ],
    invalid: [
        {
            name: "should sort specifiers",
            code: stripIndent`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
            output: stripIndent`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
            errors: [{ messageId: "sortExports" }],
        },
    ],
});
