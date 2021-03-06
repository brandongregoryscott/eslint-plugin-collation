import { ESLintUtils } from "@typescript-eslint/utils";
import { noInlineExport } from "./no-inline-export";
import { stripIndent } from "common-tags";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("noInlineExport", noInlineExport, {
    valid: [
        {
            name: "should not report errors for named export at end of file",
            code: stripIndent`
                const foo = 5;
                export { foo };
            `,
        },
        {
            name: "should not report errors for default export at end of file",
            code: stripIndent`
                const foo = 5;
                export default foo;
            `,
        },
        {
            name: "should not report errors for empty module export at end of file",
            code: stripIndent`
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
            output: stripIndent`
                const foo = 5;
                export { foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline interface export to end of file",
            code: "export interface Foo {}",
            output: stripIndent`
                interface Foo {}
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline type alias export to end of file",
            code: "export type Foo = string;",
            output: stripIndent`
                type Foo = string;
                export { Foo };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline default export to end of file",
            code: "export default function foo() {};",
            output: stripIndent`
                function foo() {};
                export default foo;
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline exports to end of file when statements exist between",
            code: stripIndent`
                export const noop = () => {};

                const foo = () => {};

                const bar = () => {};
            `,
            output: stripIndent`
                const noop = () => {};

                const foo = () => {};

                const bar = () => {};
                export { noop };
            `,
            errors: [{ messageId: "noInlineExport" }],
        },
        {
            name: "should move inline export to end of module scope in declarations file",
            code: stripIndent`
                declare module "opus-media-recorder" {
                    export interface OpusMediaRecorderWorkerOptions {
                        OggOpusEncoderWasmPath: string;
                        WebMOpusEncoderWasmPath: string;
                        encoderWorkerFactory: () => Worker;
                    }
                }
            `,
            output: stripIndent`
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
            code: stripIndent`
                declare module "foo" {
                    export interface Foo {}
                }

                declare module "bar" {
                    export interface Bar {}
                }
            `,
            output: stripIndent`
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
