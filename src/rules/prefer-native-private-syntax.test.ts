import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { preferNativePrivateSyntax } from "./prefer-native-private-syntax";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("preferNativePrivateSyntax", preferNativePrivateSyntax, {
    invalid: [
        {
            code: codeBlock`
                class Foo { private /* keep */ bar = 1; }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "preserves comments before a private property",
            output: codeBlock`
                class Foo { /* keep */ #bar = 1; }
            `,
        },
        {
            code: codeBlock`
                class Foo { private /* keep */ bar() {} }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "preserves comments before a private method",
            output: codeBlock`
                class Foo { /* keep */ #bar() {} }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private property to native syntax",
            output: codeBlock`
                class Foo {
                    #bar = 5;
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private method to native syntax",
            output: codeBlock`
                class Foo {
                    #bar() {
                        return 5;
                    }
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private bar: number = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private property with type annotation",
            output: codeBlock`
                class Foo {
                    #bar: number = 5;
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private bar(): number {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private method with return type",
            output: codeBlock`
                class Foo {
                    #bar(): number {
                        return 5;
                    }
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private bar = 5;
                    private baz() {
                        return this.bar;
                    }
                }
            `,
            errors: [
                { messageId: "preferPrivateHash" },
                { messageId: "preferPrivateHash" },
            ],
            name: "should fix multiple private members",
            output: codeBlock`
                class Foo {
                    #bar = 5;
                    #baz() {
                        return this.bar;
                    }
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private readonly bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private readonly property",
            output: codeBlock`
                class Foo {
                    readonly #bar = 5;
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private async bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private async method",
            output: codeBlock`
                class Foo {
                    async #bar() {
                        return 5;
                    }
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private static bar = 5;
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private static property",
            output: codeBlock`
                class Foo {
                    static #bar = 5;
                }
            `,
        },
        {
            code: codeBlock`
                class Foo {
                    private static bar() {
                        return 5;
                    }
                }
            `,
            errors: [{ messageId: "preferPrivateHash" }],
            name: "should fix private static method",
            output: codeBlock`
                class Foo {
                    static #bar() {
                        return 5;
                    }
                }
            `,
        },
    ],
    valid: [
        {
            code: codeBlock`
                class Foo {
                    #bar = 5;
                }
            `,
            name: "should not report errors for native private property",
        },
        {
            code: codeBlock`
                class Foo {
                    #bar() {
                        return 5;
                    }
                }
            `,
            name: "should not report errors for native private method",
        },
        {
            code: codeBlock`
                class Foo {
                    bar = 5;
                }
            `,
            name: "should not report errors for public property",
        },
        {
            code: codeBlock`
                class Foo {
                    bar() {
                        return 5;
                    }
                }
            `,
            name: "should not report errors for public method",
        },
        {
            code: codeBlock`
                class Foo {
                    protected bar = 5;
                }
            `,
            name: "should not report errors for protected property",
        },
        {
            code: codeBlock`
                class Foo {
                    protected bar() {
                        return 5;
                    }
                }
            `,
            name: "should not report errors for protected method",
        },
    ],
});
