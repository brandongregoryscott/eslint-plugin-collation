import { codeBlock } from "common-tags";
import { defaultExportMatchesFilename } from "./default-export-matches-filename";
import { ESLintUtils } from "@typescript-eslint/utils";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run(
    "default-export-matches-filename",
    defaultExportMatchesFilename,
    {
        valid: [
            {
                code: "export default function example() {}",
                filename: "example.js",
            },
            {
                filename: "Example.js",
                code: "export default function Example() {}",
            },
            {
                filename: "example.js",
                code: "export default example;",
            },
            {
                filename: "example-function.js",
                code: "export default exampleFunction;",
            },
            {
                filename: "example-function.js",
                code: "export default function ExampleFunction() {};",
            },
            {
                name: "should ignore higher-order-component exports",
                code: "export default compose(withErrorHandling, withContext)(Foo)",
            },
            {
                name: "should skip d.ts files",
                filename: "globals.d.ts",
                code: codeBlock`
                    declare module 'foo' {
                        export default foo;
                    }
                `,
            },
        ],
        invalid: [
            {
                name: "should add variable declaration for anonymous array export",
                filename: "example.js",
                code: "export default [];",
                output: codeBlock`
                    const example = [];
                    export default example
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous number export",
                filename: "example.js",
                code: "export default 5;",
                output: codeBlock`
                    const example = 5;
                    export default example
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous string export",
                filename: "example.js",
                code: "export default 'example';",
                output: codeBlock`
                    const example = 'example';
                    export default example
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous object export",
                filename: "example.js",
                code: "export default {};",
                output: codeBlock`
                    const example = {};
                    export default example
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous function export",
                filename: "example.js",
                code: "export default function() {};",
                output: codeBlock`
                    function example() {}
                    export default example;
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous arrow function export",
                filename: "example.js",
                code: "export default () => {};",
                output: codeBlock`
                    const example = () => {};
                    export default example
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should add variable declaration for anonymous class export",
                filename: "example.js",
                code: "export default class {};",
                output: codeBlock`
                    class example {}
                    export default example;
                `,
                errors: [{ messageId: "defaultExportMissingName" }],
            },
            {
                name: "should use camel case name when filename contains spaces",
                filename: "example function.js",
                code: "export default function example() {}",
                output: "export default function exampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "should use camel case name when filename contains dashes",
                filename: "example-function.js",
                code: "export default function example() {}",
                output: "export default function exampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "should use camel case name when filename contains underscores",
                filename: "example_function.js",
                code: "export default function example() {}",
                output: "export default function exampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "should use base filename (part before the first '.')",
                filename: "example-function.test.js",
                code: "export default function example() {}",
                output: "export default function exampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "should use camel case from filename",
                filename: "exampleFunction.js",
                code: "export default function example() {}",
                output: "export default function exampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "should use title case from filename",
                filename: "ExampleFunction.js",
                code: "export default function example() {}",
                output: "export default function ExampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "uses basename of nested file path",
                filename: "/Users/Brandon/app/ExampleFunction.js",
                code: "export default function example() {}",
                output: "export default function ExampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "uses parent directory name when filename is 'index'",
                filename: "/Users/Brandon/app/ExampleFunction/index.js",
                code: "export default function example() {}",
                output: "export default function ExampleFunction() {}",
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "replaces identifiers that match export name",
                filename: "List.tsx",
                code: codeBlock`
                    const MyList = () => {}

                    export default MyList;
                `,
                output: codeBlock`
                    const List = () => {}

                    export default List;
                `,
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
            {
                name: "preserves type annotation in replaced identifier",
                filename: "List.tsx",
                code: codeBlock`
                    const MyList: React.FC = () => {}

                    export default MyList;
                `,
                output: codeBlock`
                    const List: React.FC = () => {}

                    export default List;
                `,
                errors: [{ messageId: "defaultExportDoesNotMatchFilename" }],
            },
        ],
    }
);
