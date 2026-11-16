import { RuleTester } from "../test/test-utils";
import { noInlineExport } from "./no-inline-export";
import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noInlineExport", noInlineExport, {
    valid: [
        {
            name: "should not report errors for named export at end of file",
            code: codeBlock`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for default export at end of file",
            code: codeBlock`
                const foo = 5;
                export default foo;
            `,
        },
        {
            name: "should not report errors for empty module export at end of file",
            code: codeBlock`
                declare global {
                    interface Window {
                        analytics: import("@segment/analytics-next").Analytics;
                    }
                }

                export {};
            `,
        },
    ],
    invalid: [
        {
            name: "keeps trailing comments on the declaration when inserting an export",
            code: codeBlock`
                export const a = 1; // a docs
            `,
            output: codeBlock`
                const a = 1; // a docs
                export { a };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },

        {
            name: "preserves line comments before a multiline default declaration",
            code: codeBlock`
                export default // keep
                function a() {
                    // body
                }
            `,
            output: codeBlock`
                // keep
                function a() {
                    // body
                }
                export default a;
            `,
            errors: [{ messageId: "noInlineExport" }],
        },

        {
            name: "preserves a line comment between export and declaration",
            code: codeBlock`
                export // keep
                const a = 1;
            `,
            output: codeBlock`
                // keep
                const a = 1;
                export { a };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "preserves comments before a named declaration",
            code: codeBlock`
                export /* keep */ const a = 1;
            `,
            output: codeBlock`
                /* keep */ const a = 1;
                export { a };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "preserves comments before a default declaration",
            code: codeBlock`
                export default /* keep */ function a() {}
            `,
            output: codeBlock`
                /* keep */ function a() {}
                export default a;
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "copies comments inside an inline declaration",
            code: codeBlock`
                export function a() { /* keep */ }
            `,
            output: codeBlock`
                function a() { /* keep */ }
                export { a };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline named export to end of file",
            code: codeBlock`
                export const foo = 5;
            `,
            output: codeBlock`
                const foo = 5;
                export { foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline interface export to end of file",
            code: codeBlock`
                export interface Foo {}
            `,
            output: codeBlock`
                interface Foo {}
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline type alias export to end of file",
            code: codeBlock`
                export type Foo = string;
            `,
            output: codeBlock`
                type Foo = string;
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline default export to end of file",
            code: codeBlock`
                export default function foo() {};
            `,
            output: codeBlock`
                function foo() {};
                export default foo;
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline exports to end of file when statements exist between",
            code: codeBlock`
                export const noop = () => {};

                const foo = () => {};

                const bar = () => {};
            `,
            output: codeBlock`
                const noop = () => {};

                const foo = () => {};

                const bar = () => {};
                export { noop };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline export to end of module scope in declarations file",
            code: codeBlock`
                declare module "opus-media-recorder" {
                    export interface OpusMediaRecorderWorkerOptions {
                        OggOpusEncoderWasmPath: string;
                        WebMOpusEncoderWasmPath: string;
                        encoderWorkerFactory: () => Worker;
                    }
                }
            `,
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
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline exports to end of respective module scope in declarations file",
            code: codeBlock`
                declare module "foo" {
                    export interface Foo {}
                }

                declare module "bar" {
                    export interface Bar {}
                }
            `,
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
            errors: [
                { messageId: "noInlineExport" },
                { messageId: "noInlineExport" },
            ],
        },
    ],
});
