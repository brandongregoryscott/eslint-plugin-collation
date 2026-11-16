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
            code: 'export { a, /* keep */ b } from "mod";',
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
            code: 'export { b, // b docs\n    a } from "mod";',
            output: 'export {\n    a,\n    b, // b docs\n} from "mod";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "moves block comments before commas with the preceding specifier",
            code: 'export { b /* b docs */, a } from "mod";',
            output: 'export { a, b /* b docs */ } from "mod";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves comments within aliases and individual type modifiers",
            code: 'export { type Z, type /* a docs */ A, b as c } from "mod";',
            output: 'export { type /* a docs */ A, b as c, type Z } from "mod";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves CRLF when sorting commented exports",
            code: 'export {\r\n    // b docs\r\n    b,\r\n    a,\r\n} from "mod";',
            output: 'export {\r\n    a,\r\n    // b docs\r\n    b,\r\n} from "mod";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "moves leading block comments with export specifiers",
            code: 'export { /* keep */ b, a } from "mod";',
            output: 'export { a, /* keep */ b } from "mod";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "sorts the commented export list from issue 102",
            code: 'export {\n // core\n reactive, ref,\n // utilities\n isRef,\n // advanced\n customRef,\n} from "@vue/reactivity";',
            output: 'export {\n // advanced\n customRef,\n // utilities\n isRef,\n // core\n reactive,\n ref,\n} from "@vue/reactivity";',
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "preserves leading and trailing comments while sorting",
            code: '// before\nexport { b, a } from "mod"; // after',
            output: '// before\nexport { a, b } from "mod"; // after',
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
