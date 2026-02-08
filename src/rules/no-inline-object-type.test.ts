import { RuleTester } from "../test/test-utils";
import { noInlineObjectType } from "./no-inline-object-type";
import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("noInlineObjectType", noInlineObjectType, {
    valid: [
        {
            name: "should not report errors for function with primitive parameter",
            code: codeBlock`
                function foo(id: string) {}
            `,
        },
        {
            name: "should not report errors for function using named type alias",
            code: codeBlock`
                type FooOptions = { id: string };
                function foo(options: FooOptions) {}
            `,
        },
        {
            name: "should not report errors for function using named interface",
            code: codeBlock`
                interface FooOptions { id: string }
                function foo(options: FooOptions) {}
            `,
        },
        {
            name: "should not report errors for arrow function using named type alias",
            code: codeBlock`
                type FooOptions = { id: string };
                const foo = (options: FooOptions) => {};
            `,
        },
        {
            name: "should not report errors for class methods using named type alias",
            code: codeBlock`
                type FooOptions = { id: string };
                class Bar {
                    static foo(options: FooOptions) {}
                }
            `,
        },
        {
            name: "should not report errors for function with primitive return type",
            code: codeBlock`
                function foo(): string { return ""; }
            `,
        },
        {
            name: "should not report errors for function using named type alias return type",
            code: codeBlock`
                type FooResult = { id: string };
                function foo(): FooResult { return { id: "" }; }
            `,
        },
        {
            name: "should not report errors for arrow function using named type alias return type",
            code: codeBlock`
                type FooResult = { id: string };
                const foo = (): FooResult => ({ id: "" });
            `,
        },
        {
            name: "should not report errors for class methods using type references as return type",
            code: codeBlock`
                type FooResult = { id: string };
                class Bar {
                    static foo(): FooResult { return { id: "" }; }
                }
            `,
        },
        {
            name: "should not report errors for anonymous function without extractable name",
            code: codeBlock`
                const arr = [1, 2, 3].map(function(x: { value: number }) { return x.value; });
            `,
        },
        {
            name: "should not report errors for anonymous arrow function without extractable name",
            code: codeBlock`
                const arr = [1, 2, 3].map((x: { value: number }) => { return x.value; });
            `,
        },
    ],
    invalid: [
        {
            name: "should extract inline object type from function parameter",
            code: codeBlock`
                function foo(options: { id: string; otherId?: string }) {}
            `,
            output: codeBlock`
                type FooOptions = { id: string; otherId?: string };

                function foo(options: FooOptions) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from function return type",
            code: codeBlock`
                function foo(input: string): { id: string; otherId?: string } {
                    return { id: input };
                }
            `,
            output: codeBlock`
                type FooResult = { id: string; otherId?: string };

                function foo(input: string): FooResult {
                    return { id: input };
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should report errors for both parameter and return type inline objects",
            code: codeBlock`
                function foo(options: { id: string }): { result: boolean } {
                    return { result: true };
                }
            `,
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
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
        },
        {
            name: "should extract inline object type from arrow function parameter",
            code: codeBlock`
                const foo = (options: { id: string }) => {};
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                const foo = (options: FooOptions) => {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from arrow function return type",
            code: codeBlock`
                const foo = (): { id: string } => ({ id: "" });
            `,
            output: codeBlock`
                type FooResult = { id: string };

                const foo = (): FooResult => ({ id: "" });
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from function expression parameter",
            code: codeBlock`
                const foo = function(options: { id: string }) {};
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                const foo = function(options: FooOptions) {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from named function expression",
            code: codeBlock`
                const bar = function foo(options: { id: string }) {};
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                const bar = function foo(options: FooOptions) {};
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from class method parameter",
            code: codeBlock`
                class MyClass {
                    doSomething(options: { id: string }) {}
                }
            `,
            output: codeBlock`
                type DoSomethingOptions = { id: string };

                class MyClass {
                    doSomething(options: DoSomethingOptions) {}
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from class method return type",
            code: codeBlock`
                class MyClass {
                    doSomething(): { id: string } {
                        return { id: "" };
                    }
                }
            `,
            output: codeBlock`
                type DoSomethingResult = { id: string };

                class MyClass {
                    doSomething(): DoSomethingResult {
                        return { id: "" };
                    }
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from interface method signature",
            code: codeBlock`
                interface MyInterface {
                    doSomething(options: { id: string }): void;
                }
            `,
            output: codeBlock`
                type DoSomethingOptions = { id: string };

                interface MyInterface {
                    doSomething(options: DoSomethingOptions): void;
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from interface method return type",
            code: codeBlock`
                interface MyInterface {
                    doSomething(): { id: string };
                }
            `,
            output: codeBlock`
                type DoSomethingResult = { id: string };

                interface MyInterface {
                    doSomething(): DoSomethingResult;
                }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should use custom parameter type name pattern",
            code: codeBlock`
                function foo(options: { id: string }) {}
            `,
            options: [{ parameterTypeNamePattern: "{{functionName}}Params" }],
            output: codeBlock`
                type fooParams = { id: string };

                function foo(options: fooParams) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should use custom return type name pattern",
            code: codeBlock`
                function foo(): { id: string } { return { id: "" }; }
            `,
            options: [{ returnTypeNamePattern: "{{functionName}}Output" }],
            output: codeBlock`
                type fooOutput = { id: string };

                function foo(): fooOutput { return { id: "" }; }
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should handle multiline object types",
            code: codeBlock`
                function foo(options: {
                    id: string;
                    name: string;
                    age: number;
                }) {}
            `,
            output: codeBlock`
                type FooOptions = {
                    id: string;
                    name: string;
                    age: number;
                };

                function foo(options: FooOptions) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from parameter with default value",
            code: codeBlock`
                function foo(options: { id: string } = { id: "" }) {}
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                function foo(options: FooOptions = { id: "" }) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from exported function",
            code: codeBlock`
                export function foo(options: { id: string }) {}
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                export function foo(options: FooOptions) {}
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should extract inline object type from declare function",
            code: codeBlock`
                declare function foo(options: { id: string }): void;
            `,
            output: codeBlock`
                type FooOptions = { id: string };

                declare function foo(options: FooOptions): void;
            `,
            errors: [{ messageId: "noInlineObjectType" }],
        },
        {
            name: "should generate unique type names for multiple inline object type parameters",
            code: codeBlock`
                function foo(options: { id: string }, config: { enabled: boolean }) {}
            `,
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
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
        },
        {
            name: "should use paramName placeholder in custom pattern",
            code: codeBlock`
                function createUser(userData: { name: string }, settings: { notify: boolean }) {}
            `,
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
            errors: [
                { messageId: "noInlineObjectType" },
                { messageId: "noInlineObjectType" },
            ],
        },
    ],
});
