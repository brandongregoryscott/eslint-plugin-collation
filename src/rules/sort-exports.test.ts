import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { sortExports } from "./sort-exports";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("sortExports", sortExports, {
    invalid: [
        ...["with", "assert"].map((keyword) => ({
            code: `export /* before */ { z, a } /* after */ from './x' ${keyword} { type: 'json' };`,
            errors: [{ messageId: "sortExports" as const }],
            name: `preserves ${keyword} attributes and surrounding comments`,
            output: `export /* before */ { a, z } /* after */ from './x' ${keyword} { type: 'json' };`,
        })),

        {
            code: codeBlock`
                export { b, // b docs
                    a } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "moves trailing line comments with their specifier",
            output: codeBlock`
                export {
                    a,
                    b, // b docs
                } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { b /* b docs */, a } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "moves block comments before commas with the preceding specifier",
            output: codeBlock`
                export { a, b /* b docs */ } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { type Z, type /* a docs */ A, b as c } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "preserves comments within aliases and individual type modifiers",
            output: codeBlock`
                export { type /* a docs */ A, b as c, type Z } from "mod";
            `,
        },
        {
            code: codeBlock`
                export {
                    // b docs
                    b,
                    a,
                } from "mod";
            `.replaceAll("\n", "\r\n"),
            errors: [{ messageId: "sortExports" }],
            name: "preserves CRLF when sorting commented exports",
            output: codeBlock`
                export {
                    a,
                    // b docs
                    b,
                } from "mod";
            `.replaceAll("\n", "\r\n"),
        },
        {
            code: codeBlock`
                export { /* keep */ b, a } from "mod";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "moves leading block comments with export specifiers",
            output: codeBlock`
                export { a, /* keep */ b } from "mod";
            `,
        },
        {
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
            errors: [{ messageId: "sortExports" }],
            name: "sorts the commented export list from issue 102",
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
        },
        {
            code: codeBlock`
                // before
                export { b, a } from "mod"; // after
            `,
            errors: [{ messageId: "sortExports" }],
            name: "preserves leading and trailing comments while sorting",
            output: codeBlock`
                // before
                export { a, b } from "mod"; // after
            `,
        },
        {
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
            errors: [{ messageId: "sortExports" }],
            name: "should sort specifiers",
            output: codeBlock`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
        },
        {
            code: codeBlock`
                export { Foo, bar };
            `,
            errors: [{ messageId: "sortExports" }],
            name: "should sort lowercase specifiers first",
            output: codeBlock`
                export { bar, Foo };
            `,
        },
        {
            code: codeBlock`
                export type { Foo, Bar };
            `,
            errors: [{ messageId: "sortExports" }],
            name: "should sort type export statements",
            output: codeBlock`
                export type { Bar, Foo };
            `,
        },
        {
            code: codeBlock`
                export type { Foo, Bar } from "./types";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "should maintain module",
            output: codeBlock`
                export type { Bar, Foo } from "./types";
            `,
        },
        {
            code: codeBlock`
                export { isNilOrEmpty, default as isEmpty } from "./utils";
            `,
            errors: [{ messageId: "sortExports" }],
            name: "should maintain aliases",
            output: codeBlock`
                export { default as isEmpty, isNilOrEmpty } from "./utils";
            `,
        },
    ],
    valid: [
        {
            code: codeBlock`
                export { a, /* keep */ b } from "mod";
            `,
            name: "accepts sorted exports containing comments",
        },

        {
            code: codeBlock`
                const foo = 5;
                export { foo };
            `,
            name: "should not report errors for single export",
        },
        {
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { bar, foo };
            `,
            name: "should not report errors for export statement with multiple specifiers that are sorted",
        },
    ],
});
