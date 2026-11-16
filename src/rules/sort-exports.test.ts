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
            name: "skips autofix for block comments inside an export",
            code: 'export { /* keep */ b, a } from "mod";',
            output: null,
            errors: [{ messageId: "sortExports" }],
        },
        {
            name: "skips autofix for the grouped comments from issue 102",
            code: 'export {\n // core\n reactive, ref,\n // utilities\n isRef,\n // advanced\n customRef,\n} from "@vue/reactivity";',
            output: null,
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
