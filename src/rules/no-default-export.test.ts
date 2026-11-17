import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noDefaultExport } from "./no-default-export";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noDefaultExport", noDefaultExport, {
    invalid: [
        ...["\n", "\r\n"].map((newline) => ({
            code: `const a = 1; export default /* block */ // line${newline}a;`,
            errors: [{ messageId: "noDefaultExport" as const }],
            name: `preserves comment separators when moving default export comments: ${JSON.stringify(
                newline
            )}`,
            output: `/* block */ // line${newline}export const a = 1; `,
        })),

        ...[
            "import Foo from './foo';",
            "import { Foo } from './foo';",
            "import * as Foo from './foo';",
            "import Foo = require('./foo');",
        ].map((statement) => ({
            code: `${statement} export default Foo;`,
            errors: [{ messageId: "noDefaultExport" as const }],
            name: `reports imported default binding without an unsafe fix: ${statement}`,
            output: null,
        })),

        {
            code: codeBlock`
                export default // keep
                function a() {}
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "preserves a line comment after the default keyword",
            output: codeBlock`
                export // keep
                function a() {}
            `,
        },
        {
            code: codeBlock`
                const a = 1; export default /* keep */ a;
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "moves comments with the exported declaration",
            output: codeBlock`
                /* keep */ export const a = 1;
            `.concat(" "),
        },
        {
            code: codeBlock`
                export /* keep */ default function a() {}
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "preserves comments between export keywords",
            output: codeBlock`
                export /* keep */ function a() {}
            `,
        },
        {
            code: codeBlock`
                export default function a() { /* keep */ }
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "copies comments inside the exported declaration",
            output: codeBlock`
                export function a() { /* keep */ }
            `,
        },
        {
            code: codeBlock`
                export default function noop() {};
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "should fix in-line function default export",
            output: codeBlock`
                export function noop() {};
            `,
        },
        {
            code: codeBlock`
                const foo = 5; export default foo;
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "should fix standalone default export statement",
            output: codeBlock`
                export const foo = 5;
            `.concat(" "),
        },
        {
            code: codeBlock`
                export default () => {};
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "should report errors for anonymous function default export",
        },
        {
            code: codeBlock`
                export default 5;
            `,
            errors: [{ messageId: "noDefaultExport" }],
            name: "should report errors for variable default export",
        },
    ],
    valid: [
        {
            code: codeBlock`
                export const noop = () => {};
            `,
            name: "should not report errors for in-line named export",
        },
        {
            code: codeBlock`
                const noop = () => {}; export { noop };
            `,
            name: "should not report errors for named export group",
        },
    ],
});
