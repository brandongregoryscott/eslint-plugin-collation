import { ESLintUtils } from "@typescript-eslint/utils";
import { groupExports } from "./group-exports";
import { stripIndent } from "common-tags";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("groupExports", groupExports, {
    valid: [
        {
            name: "should not report errors for single export",
            code: stripIndent`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for export statement with multiple specifiers",
            code: stripIndent`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
        },
    ],
    invalid: [
        {
            name: "should consolidate multiple export statements into one",
            code: stripIndent`
                const foo = 5;
                const bar = 4;
                export { foo };
                export { bar };
            `,
            output: stripIndent`
                const foo = 5;
                const bar = 4;

                export { bar, foo };
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should consolidate multiple type export statements into one",
            code: stripIndent`
                type Foo = number;
                type Bar = string;
                export type { Foo };
                export type { Bar };
            `,
            output: stripIndent`
                type Foo = number;
                type Bar = string;

                export type { Bar, Foo };
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should consolidate mixed export statements into two separate exports",
            code: stripIndent`
                type Foo = number;
                const foo: Foo = 5;

                type Bar = string;
                const bar: Bar = "bar";

                export type { Foo };
                export { foo };
                export type { Bar };
                export { bar };
            `,
            output: stripIndent`
                type Foo = number;
                const foo: Foo = 5;

                type Bar = string;
                const bar: Bar = "bar";



                export type { Bar, Foo };
                export { bar, foo };
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
    ],
});
