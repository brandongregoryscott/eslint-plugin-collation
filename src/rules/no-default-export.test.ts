import { codeBlock } from "common-tags";
import { RuleTester } from "../test/test-utils";
import { noDefaultExport } from "./no-default-export";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noDefaultExport", noDefaultExport, {
    valid: [
        {
            name: "should not report errors for in-line named export",
            code: codeBlock`
                export const noop = () => {};
            `,
        },
        {
            name: "should not report errors for named export group",
            code: codeBlock`
                const noop = () => {}; export { noop };
            `,
        },
    ],
    invalid: [
        ...[
            "import Foo from './foo';",
            "import { Foo } from './foo';",
            "import * as Foo from './foo';",
            "import Foo = require('./foo');",
        ].map((statement) => ({
            name: `reports imported default binding without an unsafe fix: ${statement}`,
            code: `${statement} export default Foo;`,
            output: null,
            errors: [{ messageId: "noDefaultExport" as const }],
        })),

        {
            name: "preserves a line comment after the default keyword",
            code: codeBlock`
                export default // keep
                function a() {}
            `,
            output: codeBlock`
                export // keep
                function a() {}
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "moves comments with the exported declaration",
            code: codeBlock`
                const a = 1; export default /* keep */ a;
            `,
            output: codeBlock`
                /* keep */ export const a = 1;
            `.concat(" "),
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "preserves comments between export keywords",
            code: codeBlock`
                export /* keep */ default function a() {}
            `,
            output: codeBlock`
                export /* keep */ function a() {}
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "copies comments inside the exported declaration",
            code: codeBlock`
                export default function a() { /* keep */ }
            `,
            output: codeBlock`
                export function a() { /* keep */ }
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should fix in-line function default export",
            code: codeBlock`
                export default function noop() {};
            `,
            output: codeBlock`
                export function noop() {};
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should fix standalone default export statement",
            code: codeBlock`
                const foo = 5; export default foo;
            `,
            output: codeBlock`
                export const foo = 5;
            `.concat(" "),
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should report errors for anonymous function default export",
            code: codeBlock`
                export default () => {};
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
        {
            name: "should report errors for variable default export",
            code: codeBlock`
                export default 5;
            `,
            errors: [{ messageId: "noDefaultExport" }],
        },
    ],
});
