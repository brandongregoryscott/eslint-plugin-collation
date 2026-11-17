import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { Linter } from "@typescript-eslint/utils/ts-eslint";
import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { RuleTester } from "../test/test-utils";
import { groupExports } from "./group-exports";
import { sortExports } from "./sort-exports";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("groupExports", groupExports, {
    invalid: [
        {
            code: `const a = 1, b = 2;
export /* a docs */ {a};
export /* b docs */ {b};`,
            errors: [{ messageId: "groupExports" }],
            name: "retains the first declaration envelope and transfers outside-list comments",
            output: `const a = 1, b = 2;
export /* a docs */ { a, /* b docs */ b };`,
        },
        ...["with", "assert"].map((keyword) => ({
            code: `export { a } from './x' ${keyword} { type: 'json' };
export { b } from './x' ${keyword} { type: 'json' };`,
            errors: [{ messageId: "groupExports" as const }],
            name: `groups exports while preserving ${keyword} attributes`,
            output: `export { a, b } from './x' ${keyword} { type: 'json' };`,
        })),
        {
            code: `export { a } from './x' with { type: 'json' };
export /* b docs */ { b } /* b detail */ from './x' with { /* attribute docs */ type: 'json' };`,
            errors: [{ messageId: "groupExports" }],
            name: "transfers comments after a removed specifier list and within attributes",
            output: `export { a, /* b docs */ b /* b detail */ /* attribute docs */ } from './x' with { type: 'json' };`,
        },
        {
            code: `export /* envelope */ { /* empty */ } from './x' with { type: 'json' };
export { b } from './x' with { type: 'json' };`,
            errors: [{ messageId: "groupExports" }],
            name: "preserves attributes when the retained export list is empty",
            output: `export /* envelope */ { /* empty */ b } from './x' with { type: 'json' };`,
        },

        {
            code: codeBlock`
                /* file header */
                export { a } from "mod";
                export { b } from "mod";
                // file footer
            `,
            errors: [{ messageId: "groupExports" }],
            name: "preserves file header and footer comments outside the grouped list",
            output: codeBlock`
                /* file header */
                export { a, b } from "mod";
                // file footer
            `,
        },
        {
            code: `
// file header

export { a } from "mod";
export { b } from "mod";

/* file footer */
`,
            errors: [{ messageId: "groupExports" }],
            name: "preserves file boundaries when the program starts with whitespace",
            output: `
// file header

export { a, b } from "mod";

/* file footer */
`,
        },

        {
            code: codeBlock`
                export { a } from "mod";
                export { b } from "mod"; // b docs
            `,
            errors: [{ messageId: "groupExports" }],
            name: "moves the final export's trailing comment with its specifier",
            output: codeBlock`
                export {
                    a,
                    b, // b docs
                } from "mod";
            `,
        },

        {
            code: codeBlock`
                // a docs
                export { a } from "one";
                // b docs
                export { b } from "two";
                export { c } from "one";
                export { d } from "two";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
            name: "moves statement comments with the correct module group",
            output: codeBlock`
                // a docs
                export { a, c } from "one";
                export {
                    // b docs
                    b,
                    d,
                } from "two";
            `,
        },
        {
            code: codeBlock`
                export {
                    // b docs
                    b, // b detail
                } from "mod";
                export { a } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "groups internal comments and trailing specifier comments",
            output: codeBlock`
                export {
                    // b docs
                    b, // b detail
                    a,
                } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { /* empty */ } from "mod";
                export { a } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "preserves comments inside empty exports",
            output: codeBlock`
                export { /* empty */ a } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { /* first */ } from "mod";
                export { /* second */ } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "preserves comments when all grouped exports are empty",
            output: codeBlock`
                export {
                /* first */ /* second */${" "}
                } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { /* keep */ a } from "a";
                export { b } from "a";
                export { c } from "b";
                export { d } from "b";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
            name: "groups both commented and comment-free exports",
            output: codeBlock`
                export { /* keep */ a, b } from "a";
                export { c, d } from "b";
            `,
        },
        {
            code: codeBlock`
                export { a } from "mod"; // keep
                export { b } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "preserves a trailing line comment between exports",
            output: codeBlock`
                export {
                    a, // keep
                    b,
                } from "mod";
            `,
        },

        {
            code: codeBlock`
                export { /* keep */ a } from "mod";
                export { b } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "groups exports with their comments",
            output: codeBlock`
                export { /* keep */ a, b } from "mod";
            `,
        },
        {
            code: codeBlock`
                export { a } from "mod";
                // keep
                export { b } from "mod";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "preserves comments between grouped exports",
            output: codeBlock`
                export {
                    a,
                    // keep
                    b,
                } from "mod";
            `,
        },
        {
            code: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo };
                export { bar };
            `,
            errors: [{ messageId: "groupExports" }],
            name: "should consolidate multiple export statements into one",
            output: codeBlock`
                const foo = 5;
                const bar = 4;
                export { foo, bar };
            `,
        },
        {
            code: codeBlock`
                type Foo = number;
                type Bar = string;
                export type { Foo };
                export type { Bar };
            `,
            errors: [{ messageId: "groupExports" }],
            name: "should consolidate multiple type export statements into one",
            output: codeBlock`
                type Foo = number;
                type Bar = string;
                export type { Foo, Bar };
            `,
        },
        {
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
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
            name: "should consolidate mixed export statements into two separate exports",
            output: codeBlock`
                type Foo = number;
                const foo: Foo = 5;

                type Bar = string;
                const bar: Bar = "bar";

                export type { Foo, Bar };
                export { foo, bar };
            `,
        },
        {
            code: codeBlock`
                export { isEmpty } from "./utils";
                export { hasValues } from "./utils";
            `,
            errors: [{ messageId: "groupExports" }],
            name: "should maintain modules",
            output: codeBlock`

                export { isEmpty, hasValues } from "./utils";`,
        },
        {
            code: codeBlock`
                export { isEmpty } from "./collection-utils";
                export { isPositive } from "./number-utils";
                export { hasValues } from "./collection-utils";
                export { isNegative } from "./number-utils";
            `,
            errors: [
                { messageId: "groupExports" },
                { messageId: "groupExports" },
            ],
            name: "should maintain modules from separate modules",
            output: codeBlock`
                export { isEmpty, hasValues } from "./collection-utils";
                export { isPositive, isNegative } from "./number-utils";
            `,
        },
        {
            code: codeBlock`
                export { default as isEmpty };
                export { isNilOrEmpty };
            `,
            errors: [{ messageId: "groupExports" }],
            name: "should maintain aliases",
            output: codeBlock`
                export { default as isEmpty, isNilOrEmpty };
            `,
        },
    ],
    valid: [
        {
            code: `export { a } from './x' with { type: 'json' };
export { b } from './x' with { type: 'css' };
export { c } from './x';`,
            name: "keeps exports with differing attributes separate",
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
                export { foo, bar };
            `,
            name: "should not report errors for export statement with multiple specifiers",
        },
        {
            code: codeBlock`
                export namespace Hello {
                    export interface World {}
                    export interface Foo {}
                }
            `,
            name: "should not report errors for namespace export with multiple in-line exports",
        },
        {
            code: codeBlock`
                export { default as useSiteMetadata } from "./use-site-metadata";
                export { default as useCategoriesList } from "./use-categories-list";
                export { default as useTagsList } from "./use-tags-list";
            `,
            name: "should not report errors for exports from separate modules",
        },
    ],
});

describe("grouping and sorting autofixes", () => {
    it.each(["", " with { type: 'json' }"])(
        "preserves comments and attributes when grouping and sorting across repeated autofixes: %s",
        (attributes) => {
            const linter = new Linter();
            const config: FlatConfig.Config[] = [
                {
                    languageOptions: { parser: tsEslint.parser },
                    plugins: {
                        collation: {
                            rules: {
                                "group-exports": groupExports,
                                "sort-exports": sortExports,
                            },
                        },
                    },
                    rules: {
                        "collation/group-exports": "error",
                        "collation/sort-exports": "error",
                    },
                },
            ];
            const code = codeBlock`
        export { /* z docs */ z } from "mod"${attributes};
        export {
            // b docs
            b, // b detail
            /* a docs */ a
        } from "mod"${attributes};
    `;
            const expectedOutput = codeBlock`
        export {
            /* a docs */
            a,
            // b docs
            b, // b detail
            /* z docs */
            z,
        } from "mod"${attributes};
    `;

            const result = linter.verifyAndFix(code, config, {});
            const repeatedResult = linter.verifyAndFix(
                result.output,
                config,
                {}
            );

            expect(result.messages).toEqual([]);
            expect(result.output).toBe(expectedOutput);
            expect(repeatedResult).toMatchObject({
                fixed: false,
                messages: [],
                output: expectedOutput,
            });
        }
    );
});
