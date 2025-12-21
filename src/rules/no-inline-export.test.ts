import { RuleTester } from "../test/test-utils";
import { noInlineExport } from "./no-inline-export";
import { codeBlock } from "common-tags";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
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
            name: "should move inline named export to end of file",
            code: "export const foo = 5;",
            output: codeBlock`
                const foo = 5;
                export { foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline interface export to end of file",
            code: "export interface Foo {}",
            output: codeBlock`
                interface Foo {}
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline type alias export to end of file",
            code: "export type Foo = string;",
            output: codeBlock`
                type Foo = string;
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline default export to end of file",
            code: "export default function foo() {};",
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
