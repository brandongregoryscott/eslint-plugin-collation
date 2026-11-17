import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noInlineExport } from "./no-inline-export";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noInlineExport", noInlineExport, {
    invalid: [
        {
            code: codeBlock`
                export const a = 1; // a docs
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "keeps trailing comments on the declaration when inserting an export",
            output: codeBlock`
                const a = 1; // a docs
                export { a };
            `,
        },

        {
            code: codeBlock`
                export default // keep
                function a() {
                    // body
                }
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "preserves line comments before a multiline default declaration",
            output: codeBlock`
                // keep
                function a() {
                    // body
                }
                export default a;
            `,
        },

        {
            code: codeBlock`
                export // keep
                const a = 1;
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "preserves a line comment between export and declaration",
            output: codeBlock`
                // keep
                const a = 1;
                export { a };
            `,
        },
        {
            code: codeBlock`
                export /* keep */ const a = 1;
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "preserves comments before a named declaration",
            output: codeBlock`
                /* keep */ const a = 1;
                export { a };
            `,
        },
        {
            code: codeBlock`
                export default /* keep */ function a() {}
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "preserves comments before a default declaration",
            output: codeBlock`
                /* keep */ function a() {}
                export default a;
            `,
        },
        {
            code: codeBlock`
                export function a() { /* keep */ }
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "copies comments inside an inline declaration",
            output: codeBlock`
                function a() { /* keep */ }
                export { a };
            `,
        },
        {
            code: codeBlock`
                export const foo = 5;
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline named export to end of file",
            output: codeBlock`
                const foo = 5;
                export { foo };
            `,
        },
        {
            code: codeBlock`
                export interface Foo {}
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline interface export to end of file",
            output: codeBlock`
                interface Foo {}
                export { Foo };
            `,
        },
        {
            code: codeBlock`
                export type Foo = string;
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline type alias export to end of file",
            output: codeBlock`
                type Foo = string;
                export { Foo };
            `,
        },
        {
            code: codeBlock`
                export default function foo() {};
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline default export to end of file",
            output: codeBlock`
                function foo() {};
                export default foo;
            `,
        },
        {
            code: codeBlock`
                export const noop = () => {};

                const foo = () => {};

                const bar = () => {};
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline exports to end of file when statements exist between",
            output: codeBlock`
                const noop = () => {};

                const foo = () => {};

                const bar = () => {};
                export { noop };
            `,
        },
        {
            code: codeBlock`
                declare module "opus-media-recorder" {
                    export interface OpusMediaRecorderWorkerOptions {
                        OggOpusEncoderWasmPath: string;
                        WebMOpusEncoderWasmPath: string;
                        encoderWorkerFactory: () => Worker;
                    }
                }
            `,
            errors: [{ messageId: "noInlineExport" }],
            name: "should move inline export to end of module scope in declarations file",
            output: codeBlock`
            declare module "opus-media-recorder" {
                interface OpusMediaRecorderWorkerOptions {
                    OggOpusEncoderWasmPath: string;
                    WebMOpusEncoderWasmPath: string;
                    encoderWorkerFactory: () => Worker;
                }
            export { OpusMediaRecorderWorkerOptions };
            }
            `,
        },
        {
            code: codeBlock`
                declare module "foo" {
                    export interface Foo {}
                }

                declare module "bar" {
                    export interface Bar {}
                }
            `,
            errors: [
                { messageId: "noInlineExport" },
                { messageId: "noInlineExport" },
            ],
            name: "should move inline exports to end of respective module scope in declarations file",
            output: codeBlock`
            declare module "foo" {
                interface Foo {}
            export { Foo };
            }

            declare module "bar" {
                interface Bar {}
            export { Bar };
            }
            `,
        },
    ],
    valid: [
        {
            code: codeBlock`
                const foo = 5;
                export { foo };
            `,
            name: "should not report errors for named export at end of file",
        },
        {
            code: codeBlock`
                const foo = 5;
                export default foo;
            `,
            name: "should not report errors for default export at end of file",
        },
        {
            code: codeBlock`
                declare global {
                    interface Window {
                        analytics: import("@segment/analytics-next").Analytics;
                    }
                }

                export {};
            `,
            name: "should not report errors for empty module export at end of file",
        },
    ],
});
