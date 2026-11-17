import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noInlineObjectType } from "./no-inline-object-type";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noInlineObjectType", noInlineObjectType, {
    invalid: [
        {
            code: codeBlock`
                function foo(options: { /* keep */ id: string }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "copies comments inside an extracted type",
            output: codeBlock`
                type FooOptions = { /* keep */ id: string };

                function foo(options: FooOptions) {}
            `,
        },

        {
            code: codeBlock`
                function foo({ id }: { id: string } = { id: "" }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle defaulted destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                function foo({ id }: FooParams = { id: "" }) {}
            `,
        },
        {
            code: codeBlock`
                function foo({ user: { id: userId = "" }, ...rest }: { user: { id?: string }; active: boolean }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle nested destructuring, aliases, property defaults, and rest",
            output: codeBlock`
                type FooParams = { user: { id?: string }; active: boolean };

                function foo({ user: { id: userId = "" }, ...rest }: FooParams) {}
            `,
        },
        {
            code: codeBlock`
                function foo({}: {}) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle empty destructured parameter",
            output: codeBlock`
                type FooParams = {};

                function foo({}: FooParams) {}
            `,
        },
        {
            code: codeBlock`
                const foo = ({ id }: { id: string }) => id;
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle arrow function destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                const foo = ({ id }: FooParams) => id;
            `,
        },
        {
            code: codeBlock`
                const foo = function({ id }: { id: string }) {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle function expression destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                const foo = function({ id }: FooParams) {};
            `,
        },
        {
            code: codeBlock`
                class MyClass {
                    foo({ id }: { id: string }) {}
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle class method destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                class MyClass {
                    foo({ id }: FooParams) {}
                }
            `,
        },
        {
            code: codeBlock`
                interface MyInterface {
                    foo({ id }: { id: string }): void;
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle interface method destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                interface MyInterface {
                    foo({ id }: FooParams): void;
                }
            `,
        },
        {
            code: codeBlock`
                declare function foo({ id }: { id: string }): void;
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle declared function destructured parameter",
            output: codeBlock`
                type FooParams = { id: string };

                declare function foo({ id }: FooParams): void;
            `,
        },
        {
            code: codeBlock`
                function foo(params: string, params2: string, { id }: { id: string }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle fallback name collision with named parameters",
            output: codeBlock`
                type FooParams3 = { id: string };

                function foo(params: string, params2: string, { id }: FooParams3) {}
            `,
        },
        {
            code: codeBlock`
                function foo({ id }: { id: string }, { enabled }: { enabled: boolean }) {}
            `,
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
            name: "should keep fallback names stable across multiple autofix passes",
            output: [
                codeBlock`
                    type FooParams = { id: string };

                    function foo({ id }: FooParams, { enabled }: { enabled: boolean }) {}
                `,
                codeBlock`
                    type FooParams = { id: string };

                    type FooParams2 = { enabled: boolean };

                    function foo({ id }: FooParams, { enabled }: FooParams2) {}
                `,
            ],
        },
        {
            code: codeBlock`
                const foo = ({ id }: { id: string } = { id: "" }): { id: string } => ({ id });
            `,
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
            name: "should use the parameter pattern for destructuring independently of return types",
            options: [
                {
                    parameterTypeNamePattern:
                        "{{upperFirstFunctionName}}{{upperFirstParamName}}Type",
                    returnTypeNamePattern: "{{upperFirstFunctionName}}Output",
                },
            ],
            output: [
                codeBlock`
                    type FooParamsType = { id: string };

                    const foo = ({ id }: FooParamsType = { id: "" }): { id: string } => ({ id });
                `,
                codeBlock`
                    type FooParamsType = { id: string };

                    type FooOutput = { id: string };

                    const foo = ({ id }: FooParamsType = { id: "" }): FooOutput => ({ id });
                `,
            ],
        },
        {
            code: codeBlock`
                function Editor({ ready, signal, state }: { ready: () => void; signal?: AbortSignal; state: string }) {
                    return <div>{state}</div>;
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            filename: "editor.tsx",
            name: "should extract inline props from a destructured TSX component parameter",
            output: codeBlock`
                type EditorParams = { ready: () => void; signal?: AbortSignal; state: string };

                function Editor({ ready, signal, state }: EditorParams) {
                    return <div>{state}</div>;
                }
            `,
        },
        {
            code: codeBlock`
                function foo(options: { id: string; otherId?: string }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from function parameter",
            output: codeBlock`
                type FooOptions = { id: string; otherId?: string };

                function foo(options: FooOptions) {}
            `,
        },
        {
            code: codeBlock`
                function foo(input: string): { id: string; otherId?: string } {
                    return { id: input };
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from function return type",
            output: codeBlock`
                type FooResult = { id: string; otherId?: string };

                function foo(input: string): FooResult {
                    return { id: input };
                }
            `,
        },
        {
            code: codeBlock`
                function foo(options: { id: string }): { result: boolean } {
                    return { result: true };
                }
            `,
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
            name: "should report errors for both parameter and return type inline objects",
            // Multiple autofix passes are needed due to overlapping fix ranges
            output: [
                codeBlock`
                    type FooOptions = { id: string };

                    function foo(options: FooOptions): { result: boolean } {
                        return { result: true };
                    }
                `,
                codeBlock`
                    type FooOptions = { id: string };

                    type FooResult = { result: boolean };

                    function foo(options: FooOptions): FooResult {
                        return { result: true };
                    }
                `,
            ],
        },
        {
            code: codeBlock`
                const foo = (options: { id: string }) => {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from arrow function parameter",
            output: codeBlock`
                type FooOptions = { id: string };

                const foo = (options: FooOptions) => {};
            `,
        },
        {
            code: codeBlock`
                const foo = (): { id: string } => ({ id: "" });
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from arrow function return type",
            output: codeBlock`
                type FooResult = { id: string };

                const foo = (): FooResult => ({ id: "" });
            `,
        },
        {
            code: codeBlock`
                const foo = function(options: { id: string }) {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from function expression parameter",
            output: codeBlock`
                type FooOptions = { id: string };

                const foo = function(options: FooOptions) {};
            `,
        },
        {
            code: codeBlock`
                const bar = function foo(options: { id: string }) {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from named function expression",
            output: codeBlock`
                type FooOptions = { id: string };

                const bar = function foo(options: FooOptions) {};
            `,
        },
        {
            code: codeBlock`
                class MyClass {
                    doSomething(options: { id: string }) {}
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from class method parameter",
            output: codeBlock`
                type DoSomethingOptions = { id: string };

                class MyClass {
                    doSomething(options: DoSomethingOptions) {}
                }
            `,
        },
        {
            code: codeBlock`
                class MyClass {
                    doSomething(): { id: string } {
                        return { id: "" };
                    }
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from class method return type",
            output: codeBlock`
                type DoSomethingResult = { id: string };

                class MyClass {
                    doSomething(): DoSomethingResult {
                        return { id: "" };
                    }
                }
            `,
        },
        {
            code: codeBlock`
                interface MyInterface {
                    doSomething(options: { id: string }): void;
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from interface method signature",
            output: codeBlock`
                type DoSomethingOptions = { id: string };

                interface MyInterface {
                    doSomething(options: DoSomethingOptions): void;
                }
            `,
        },
        {
            code: codeBlock`
                interface MyInterface {
                    doSomething(): { id: string };
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from interface method return type",
            output: codeBlock`
                type DoSomethingResult = { id: string };

                interface MyInterface {
                    doSomething(): DoSomethingResult;
                }
            `,
        },
        {
            code: codeBlock`
                function foo(options: { id: string }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should use custom parameter type name pattern",
            options: [{ parameterTypeNamePattern: "{{functionName}}Params" }],
            output: codeBlock`
                type fooParams = { id: string };

                function foo(options: fooParams) {}
            `,
        },
        {
            code: codeBlock`
                function foo(): { id: string } { return { id: "" }; }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should use custom return type name pattern",
            options: [{ returnTypeNamePattern: "{{functionName}}Output" }],
            output: codeBlock`
                type fooOutput = { id: string };

                function foo(): fooOutput { return { id: "" }; }
            `,
        },
        {
            code: codeBlock`
                function foo(options: {
                    id: string;
                    name: string;
                    age: number;
                }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should handle multiline object types",
            output: codeBlock`
                type FooOptions = {
                    id: string;
                    name: string;
                    age: number;
                };

                function foo(options: FooOptions) {}
            `,
        },
        {
            code: codeBlock`
                function foo(options: { id: string } = { id: "" }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from parameter with default value",
            output: codeBlock`
                type FooOptions = { id: string };

                function foo(options: FooOptions = { id: "" }) {}
            `,
        },
        {
            code: codeBlock`
                export function foo(options: { id: string }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from exported function",
            output: codeBlock`
                type FooOptions = { id: string };

                export function foo(options: FooOptions) {}
            `,
        },
        {
            code: codeBlock`
                declare function foo(options: { id: string }): void;
            `,
            errors: [{ messageId: "noInlineObjectType" }],
            name: "should extract inline object type from declare function",
            output: codeBlock`
                type FooOptions = { id: string };

                declare function foo(options: FooOptions): void;
            `,
        },
        {
            code: codeBlock`
                function foo(options: { id: string }, config: { enabled: boolean }) {}
            `,
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
            name: "should generate unique type names for multiple inline object type parameters",
            output: [
                codeBlock`
                    type FooOptions = { id: string };

                    function foo(options: FooOptions, config: { enabled: boolean }) {}
                `,
                codeBlock`
                    type FooOptions = { id: string };

                    type FooConfig = { enabled: boolean };

                    function foo(options: FooOptions, config: FooConfig) {}
                `,
            ],
        },
        {
            code: codeBlock`
                function createUser(userData: { name: string }, settings: { notify: boolean }) {}
            `,
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
            name: "should use paramName placeholder in custom pattern",
            options: [
                {
                    parameterTypeNamePattern:
                        "{{upperFirstFunctionName}}{{upperFirstParamName}}Type",
                },
            ],
            output: [
                codeBlock`
                    type CreateUserUserDataType = { name: string };

                    function createUser(userData: CreateUserUserDataType, settings: { notify: boolean }) {}
                `,
                codeBlock`
                    type CreateUserUserDataType = { name: string };

                    type CreateUserSettingsType = { notify: boolean };

                    function createUser(userData: CreateUserUserDataType, settings: CreateUserSettingsType) {}
                `,
            ],
        },
    ],
    valid: [
        {
            code: codeBlock`
                type Options = { id: string };
                function foo({ id }: Options = { id: "" }) {}
            `,
            name: "should preserve destructured parameters using named types",
        },
        {
            code: codeBlock`
                items.map(({ id }: { id: string }) => id);
            `,
            name: "should skip anonymous destructured callbacks",
        },
        {
            code: codeBlock`
                function foo(id: string) {}
            `,
            name: "should not report errors for function with primitive parameter",
        },
        {
            code: codeBlock`
                type FooOptions = { id: string };
                function foo(options: FooOptions) {}
            `,
            name: "should not report errors for function using named type alias",
        },
        {
            code: codeBlock`
                interface FooOptions { id: string }
                function foo(options: FooOptions) {}
            `,
            name: "should not report errors for function using named interface",
        },
        {
            code: codeBlock`
                type FooOptions = { id: string };
                const foo = (options: FooOptions) => {};
            `,
            name: "should not report errors for arrow function using named type alias",
        },
        {
            code: codeBlock`
                type FooOptions = { id: string };
                class Bar {
                    static foo(options: FooOptions) {}
                }
            `,
            name: "should not report errors for class methods using named type alias",
        },
        {
            code: codeBlock`
                function foo(): string { return ""; }
            `,
            name: "should not report errors for function with primitive return type",
        },
        {
            code: codeBlock`
                type FooResult = { id: string };
                function foo(): FooResult { return { id: "" }; }
            `,
            name: "should not report errors for function using named type alias return type",
        },
        {
            code: codeBlock`
                type FooResult = { id: string };
                const foo = (): FooResult => ({ id: "" });
            `,
            name: "should not report errors for arrow function using named type alias return type",
        },
        {
            code: codeBlock`
                type FooResult = { id: string };
                class Bar {
                    static foo(): FooResult { return { id: "" }; }
                }
            `,
            name: "should not report errors for class methods using type references as return type",
        },
        {
            code: codeBlock`
                const arr = [1, 2, 3].map(function(x: { value: number }) { return x.value; });
            `,
            name: "should not report errors for anonymous function without extractable name",
        },
        {
            code: codeBlock`
                const arr = [1, 2, 3].map((x: { value: number }) => { return x.value; });
            `,
            name: "should not report errors for anonymous arrow function without extractable name",
        },
    ],
});
