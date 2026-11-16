import { RuleTester } from "../test/test-utils";
import { codeBlock } from "common-tags";
import { sortExports } from "./sort-exports";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("sortExports", sortExports, {
    valid: [
        {
            name: "accepts sorted exports containing comments",
            code: codeBlock`
                export { a, /* keep */ b } from "mod";
            `,
        },

        {
            name: "should not report errors for single export",
            code: codeBlock`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for export statement with multiple specifiers that are sorted",
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
        },
    ],
    invalid: [
        {
            name: "moves trailing line comments with their specifier",
            code: codeBlock`
                export { b, // b docs
                    a } from "mod";
            `,
            output: codeBlock`
                export {
                    a,
                    b, // b docs
                } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "moves block comments before commas with the preceding specifier",
            code: codeBlock`
                export { b /* b docs */, a } from "mod";
            `,
            output: codeBlock`
                export { a, b /* b docs */ } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves comments within aliases and individual type modifiers",
            code: codeBlock`
                export { type Z, type /* a docs */ A, b as c } from "mod";
            `,
            output: codeBlock`
                export { type /* a docs */ A, b as c, type Z } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves CRLF when sorting commented exports",
            code: codeBlock`
                export {
                    // b docs
                    b,
                    a,
                } from "mod";
            `.replaceAll("\n", "\r\n"),
            output: codeBlock`
                export {
                    a,
                    // b docs
                    b,
                } from "mod";
            `.replaceAll("\n", "\r\n"),
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "moves leading block comments with export specifiers",
            code: codeBlock`
                export { /* keep */ b, a } from "mod";
            `,
            output: codeBlock`
                export { a, /* keep */ b } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "sorts the commented export list from issue 102",
            code: codeBlock`
                export {
                    // core
                    reactive, ref,
                    // utilities
                    isRef,
                    // advanced
                    customRef,
                } from "@vue/reactivity";
            `,
            output: codeBlock`
                export {
                    // advanced
                    customRef,
                    // utilities
                    isRef,
                    // core
                    reactive,
                    ref,
                } from "@vue/reactivity";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves leading and trailing comments while sorting",
            code: codeBlock`
                // before
                export { b, a } from "mod"; // after
            `,
            output: codeBlock`
                // before
                export { a, b } from "mod"; // after
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "should sort specifiers",
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
            output: codeBlock`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "should sort lowercase specifiers first",
            code: codeBlock`
                export { Foo, bar };
            `,
            output: codeBlock`
                export { bar, Foo };
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "should sort type export statements",
            code: codeBlock`
                export type { Foo, Bar };
            `,
            output: codeBlock`
                export type { Bar, Foo };
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "should maintain module",
            code: codeBlock`
                export type { Foo, Bar } from "./types";
            `,
            output: codeBlock`
                export type { Bar, Foo } from "./types";
            `,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "should maintain aliases",
            code: codeBlock`
                export { isNilOrEmpty, default as isEmpty } from "./utils";
            `,
            output: codeBlock`
                export { default as isEmpty, isNilOrEmpty } from "./utils";
            `,
            errors: [{ messageId: "sortExports" }],
        },
    ],
});
