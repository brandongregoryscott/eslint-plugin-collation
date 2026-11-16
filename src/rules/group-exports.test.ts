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
            name: "moves the final export's trailing comment with its specifier",
            code: 'export { a } from "mod";\nexport { b } from "mod"; // b docs',
            output: 'export {\n    a,\n    b, // b docs\n} from "mod";',
            errors: [{ messageId: "groupExports" }],
        },

        {
            name: "moves statement comments with the correct module group",
            code: '// a docs\nexport { a } from "one";\n// b docs\nexport { b } from "two";\nexport { c } from "one";\nexport { d } from "two";',
            output: '// a docs\nexport { a, c } from "one";\nexport {\n    // b docs\n    b,\n    d,\n} from "two";',
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
        },
        {
            name: "groups internal comments and trailing specifier comments",
            code: 'export {\n    // b docs\n    b, // b detail\n} from "mod";\nexport { a } from "mod";',
            output: 'export {\n    // b docs\n    b, // b detail\n    a,\n} from "mod";',
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments inside empty exports",
            code: 'export { /* empty */ } from "mod";\nexport { a } from "mod";',
            output: 'export { /* empty */ a } from "mod";',
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments when all grouped exports are empty",
            code: 'export { /* first */ } from "mod";\nexport { /* second */ } from "mod";',
            output: 'export {\n/* first */ /* second */ \n} from "mod";',
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
            code: 'export { a } from "mod"; // keep\nexport { b } from "mod";',
            output: 'export {\n    a, // keep\n    b,\n} from "mod";',
            errors: [{ messageId: "groupExports" }],
        },

        {
            name: "groups exports with their comments",
            code: 'export { /* keep */ a } from "mod";\nexport { b } from "mod";',
            output: 'export { /* keep */ a, b } from "mod";',
            errors: [{ messageId: "groupExports" }],
        },
        {
            name: "preserves comments between grouped exports",
            code: 'export { a } from "mod";\n// keep\nexport { b } from "mod";',
            output: 'export {\n    a,\n    // keep\n    b,\n} from "mod";',
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
