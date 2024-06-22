import { RuleTester } from "@typescript-eslint/rule-tester";
import { groupExports } from "./group-exports";
import { codeBlock } from "common-tags";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("groupExports", groupExports, {
    valid: [
        {
            name: "should not report errors for single export",
            code: codeBlock`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for export statement with multiple specifiers",
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
        },
        {
            name: "should not report errors for namespace export with multiple in-line exports",
            code: codeBlock`
                export namespace Hello {
                    export interface World {}
                    export interface Foo {}
                }
            `,
        },
        {
            name: "should not report errors for exports from separate modules",
            code: codeBlock`
                export { default as useSiteMetadata } from "./use-site-metadata";
                export { default as useCategoriesList } from "./use-categories-list";
                export { default as useTagsList } from "./use-tags-list";
            `,
        },
    ],
    invalid: [
        {
            name: "should consolidate multiple export statements into one",
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo };
                export { bar };
            `,
            output: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should consolidate multiple type export statements into one",
            code: codeBlock`
                type Foo = number;
                type Bar = string;
                export type { Foo };
                export type { Bar };
            `,
            output: codeBlock`
                type Foo = number;
                type Bar = string;
                export type { Foo, Bar };
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should consolidate mixed export statements into two separate exports",
            code: codeBlock`
                type Foo = number;
                const foo: Foo = 5;

                type Bar = string;
                const bar: Bar = "bar";

                export type { Foo };
                export { foo };
                export type { Bar };
                export { bar };
            `,
            output: codeBlock`
                type Foo = number;
                const foo: Foo = 5;

                type Bar = string;
                const bar: Bar = "bar";

                export type { Foo, Bar };
                export { foo, bar };
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
        {
            name: "should maintain modules",
            code: codeBlock`
                export { isEmpty } from "./utils";
                export { hasValues } from "./utils";
            `,
            output: codeBlock`

                export { isEmpty, hasValues } from "./utils";`,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "should maintain modules from separate modules",
            code: codeBlock`
                export { isEmpty } from "./collection-utils";
                export { isPositive } from "./number-utils";
                export { hasValues } from "./collection-utils";
                export { isNegative } from "./number-utils";
            `,
            output: codeBlock`
                export { isEmpty, hasValues } from "./collection-utils";
                export { isPositive, isNegative } from "./number-utils";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
        {
            name: "should maintain aliases",
            code: codeBlock`
                export { default as isEmpty };
                export { isNilOrEmpty };
            `,
            output: codeBlock`
                export { default as isEmpty, isNilOrEmpty };
            `,
            errors: [{ messageId: "groupExports" }],
        },
    ],
});
