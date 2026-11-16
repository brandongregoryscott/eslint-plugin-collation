import { RuleTester } from "../test/test-utils";
import { groupExports } from "./group-exports";
import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
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
            name: "preserves file header and footer comments outside the grouped list",
            code: codeBlock`
                /* file header */
                export { a } from "mod";
                export { b } from "mod";
                // file footer
            `,
            output: codeBlock`
                /* file header */
                export { a, b } from "mod";
                // file footer
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves file boundaries when the program starts with whitespace",
            code: `
// file header

export { a } from "mod";
export { b } from "mod";

/* file footer */
`,
            output: `
// file header

export { a, b } from "mod";

/* file footer */
`,
            errors: [{ messageId: "groupExports" }],
        },

        {
            name: "moves the final export's trailing comment with its specifier",
            code: codeBlock`
                export { a } from "mod";
                export { b } from "mod"; // b docs
            `,
            output: codeBlock`
                export {
                    a,
                    b, // b docs
                } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },

        {
            name: "moves statement comments with the correct module group",
            code: codeBlock`
                // a docs
                export { a } from "one";
                // b docs
                export { b } from "two";
                export { c } from "one";
                export { d } from "two";
            `,
            output: codeBlock`
                // a docs
                export { a, c } from "one";
                export {
                    // b docs
                    b,
                    d,
                } from "two";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
        {
            name: "groups internal comments and trailing specifier comments",
            code: codeBlock`
                export {
                    // b docs
                    b, // b detail
                } from "mod";
                export { a } from "mod";
            `,
            output: codeBlock`
                export {
                    // b docs
                    b, // b detail
                    a,
                } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments inside empty exports",
            code: codeBlock`
                export { /* empty */ } from "mod";
                export { a } from "mod";
            `,
            output: codeBlock`
                export { /* empty */ a } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments when all grouped exports are empty",
            code: codeBlock`
                export { /* first */ } from "mod";
                export { /* second */ } from "mod";
            `,
            output: codeBlock`
                export {
                /* first */ /* second */${" "}
                } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "groups both commented and comment-free exports",
            code: codeBlock`
                export { /* keep */ a } from "a";
                export { b } from "a";
                export { c } from "b";
                export { d } from "b";
            `,
            output: codeBlock`
                export { /* keep */ a, b } from "a";
                export { c, d } from "b";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
        {
            name: "preserves a trailing line comment between exports",
            code: codeBlock`
                export { a } from "mod"; // keep
                export { b } from "mod";
            `,
            output: codeBlock`
                export {
                    a, // keep
                    b,
                } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },

        {
            name: "groups exports with their comments",
            code: codeBlock`
                export { /* keep */ a } from "mod";
                export { b } from "mod";
            `,
            output: codeBlock`
                export { /* keep */ a, b } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments between grouped exports",
            code: codeBlock`
                export { a } from "mod";
                // keep
                export { b } from "mod";
            `,
            output: codeBlock`
                export {
                    a,
                    // keep
                    b,
                } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
        },
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
