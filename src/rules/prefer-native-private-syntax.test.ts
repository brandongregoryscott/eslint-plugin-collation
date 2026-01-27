import { RuleTester } from "../test/test-utils";
import { preferNativePrivateSyntax } from "./prefer-native-private-syntax";
import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("preferNativePrivateSyntax", preferNativePrivateSyntax, {
    valid: [
        {
            name: "should not report errors for native private property",
            code: codeBlock`
                class Foo {
                    #bar = 5;
                }
            `,
        },
        {
            name: "should not report errors for native private method",
            code: codeBlock`
                class Foo {
                    #bar() {
                        return 5;
                    }
                }
            `,
        },
        {
            name: "should not report errors for public property",
            code: codeBlock`
                class Foo {
                    bar = 5;
                }
            `,
        },
        {
            name: "should not report errors for public method",
            code: codeBlock`
                class Foo {
                    bar() {
                        return 5;
                    }
                }
            `,
        },
        {
            name: "should not report errors for protected property",
            code: codeBlock`
                class Foo {
                    protected bar = 5;
                }
            `,
        },
        {
            name: "should not report errors for protected method",
            code: codeBlock`
                class Foo {
                    protected bar() {
                        return 5;
                    }
                }
            `,
        },
    ],
    invalid: [
        {
            name: "should fix private property to native syntax",
            code: codeBlock`
                class Foo {
                    private bar = 5;
                }
            `,
            output: codeBlock`
                class Foo {
                    #bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private method to native syntax",
            code: codeBlock`
                class Foo {
                    private bar() {
                        return 5;
                    }
                }
            `,
            output: codeBlock`
                class Foo {
                    #bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private property with type annotation",
            code: codeBlock`
                class Foo {
                    private bar: number = 5;
                }
            `,
            output: codeBlock`
                class Foo {
                    #bar: number = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private method with return type",
            code: codeBlock`
                class Foo {
                    private bar(): number {
                        return 5;
                    }
                }
            `,
            output: codeBlock`
                class Foo {
                    #bar(): number {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix multiple private members",
            code: codeBlock`
                class Foo {
                    private bar = 5;
                    private baz() {
                        return this.bar;
                    }
                }
            `,
            output: codeBlock`
                class Foo {
                    #bar = 5;
                    #baz() {
                        return this.bar;
                    }
                }
            `,
            errors: [
                { messageId: "preferPrivateHash" },
                { messageId: "preferPrivateHash" },
            ],
        },
        {
            name: "should fix private readonly property",
            code: codeBlock`
                class Foo {
                    private readonly bar = 5;
                }
            `,
            output: codeBlock`
                class Foo {
                    readonly #bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private async method",
            code: codeBlock`
                class Foo {
                    private async bar() {
                        return 5;
                    }
                }
            `,
            output: codeBlock`
                class Foo {
                    async #bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private static property",
            code: codeBlock`
                class Foo {
                    private static bar = 5;
                }
            `,
            output: codeBlock`
                class Foo {
                    static #bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
        {
            name: "should fix private static method",
            code: codeBlock`
                class Foo {
                    private static bar() {
                        return 5;
                    }
                }
            `,
            output: codeBlock`
                class Foo {
                    static #bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
        },
    ],
});
