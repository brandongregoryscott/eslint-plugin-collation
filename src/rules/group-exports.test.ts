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
        {
            name: "should not report errors for namespace export with multiple in-line exports",
            code: stripIndent`
                export namespace Hello {
                    export interface World {}
                    export interface Foo {}
                }
            `,
        },
        {
            name: "should not report errors for exports from separate modules",
            code: stripIndent`
                export { default as useSiteMetadata } from "./use-site-metadata";
                export { default as useCategoriesList } from "./use-categories-list";
                export { default as useTagsList } from "./use-tags-list";
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
        {
            name: "should maintain modules",
            code: stripIndent`
                export { isEmpty } from "./utils";
                export { hasValues } from "./utils";
            `,
            output: stripIndent`
                export { isEmpty, hasValues } from "./utils";
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should maintain modules from separate modules",
            code: stripIndent`
                export { isEmpty } from "./collection-utils";
                export { isPositive } from "./number-utils";
                export { hasValues } from "./collection-utils";
                export { isNegative } from "./number-utils";
            `,
            output: stripIndent`
                export { isEmpty, hasValues } from "./collection-utils";
                export { isPositive, isNegative } from "./number-utils";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
    ],
});
