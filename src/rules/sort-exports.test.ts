import { RuleTester } from "@typescript-eslint/rule-tester";
import { codeBlock } from "common-tags";
import { sortExports } from "./sort-exports";
import { random } from "lodash";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("sortExports", sortExports, {
    valid: [
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

it("runs without flaking", () => {
    const result = random(0, 10, false);

    expect(result).toBeLessThan(3);
});
