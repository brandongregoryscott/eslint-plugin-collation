import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noDestructuredParameter } from "./no-destructured-parameter";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("noDestructuredParameter", noDestructuredParameter, {
    invalid: [
        {
            code: codeBlock`
                function find({ id }: Options) {
                    return id;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes an ordinary function declaration",
            output: codeBlock`
                function find(parameter: Options) {
                const { id } = parameter;

                    return id;
                }
            `,
        },
        {
            code: codeBlock`
                items.map(function ({ id }) {
                    return id;
                });
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes anonymous function callbacks",
            output: codeBlock`
                items.map(function (parameter) {
                const { id } = parameter;

                    return id;
                });
            `,
        },
        {
            code: codeBlock`
                items.map(({ id }) => id);
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes an expression-bodied arrow callback",
            output: codeBlock`
                items.map((parameter) => {
                const { id } = parameter;
                return (
                id
                );
                });
            `,
        },
        {
            code: codeBlock`
                const find = ({ id }) => ({ id });
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "keeps a parenthesized object expression in the return",
            output: codeBlock`
                const find = (parameter) => {
                const { id } = parameter;
                return (
                ({ id })
                );
                };
            `,
        },
        {
            code: codeBlock`
                function first([item, ...rest]: string[]) {
                    return item;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes array parameters",
            output: codeBlock`
                function first(parameter: string[]) {
                const [item, ...rest] = parameter;

                    return item;
                }
            `,
        },
        {
            code: codeBlock`
                function combine({ first }, [second], last) {
                    return first + second + last;
                }
            `,
            errors: [
                { messageId: "destructureInBody" },
                { messageId: "destructureInBody" },
            ],
            name: "moves multiple parameters atomically in their original order",
            output: codeBlock`
                function combine(parameter, parameter2, last) {
                const { first } = parameter;
                const [second] = parameter2;

                    return first + second + last;
                }
            `,
        },
        {
            code: codeBlock`
                function find(prefix, { id }) {
                    return prefix + id;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "checks parameters beyond the first",
            output: codeBlock`
                function find(prefix, parameter) {
                const { id } = parameter;

                    return prefix + id;
                }
            `,
        },
        {
            code: codeBlock`
                function find({ id: value, nested: { name }, /* rest */ ...rest }: Options) {
                    return value;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "preserves aliases, nested destructuring, rest properties, and comments",
            output: codeBlock`
                function find(parameter: Options) {
                const { id: value, nested: { name }, /* rest */ ...rest } = parameter;

                    return value;
                }
            `,
        },
        {
            code: codeBlock`
                function find({ id }, parameter) {
                    return () => parameter2 + id;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "chooses a name that cannot capture existing references",
            output: codeBlock`
                function find(parameter3, parameter) {
                const { id } = parameter3;

                    return () => parameter2 + id;
                }
            `,
        },
        {
            code: codeBlock`
                function find({ id }) {
                    id++;
                    return id;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "preserves writes to the destructured binding",
            output: codeBlock`
                function find(parameter) {
                let { id } = parameter;

                    id++;
                    return id;
                }
            `,
        },
        {
            code: codeBlock`
                function find({ id }) {
                    "use custom";
                    return id;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "preserves directive prologues",
            output: codeBlock`
                function find(parameter) {
                    "use custom";
                const { id } = parameter;

                    return id;
                }
            `,
        },
        {
            code: codeBlock`
                class Store {
                    static find({ id }: Options) {
                        return id;
                    }
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes static and ordinary class methods",
            output: codeBlock`
                class Store {
                    static find(parameter: Options) {
                const { id } = parameter;

                        return id;
                    }
                }
            `,
        },
        {
            code: codeBlock`
                const store = {
                    find({ id }) {
                        return id;
                    },
                };
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes object methods",
            output: codeBlock`
                const store = {
                    find(parameter) {
                const { id } = parameter;

                        return id;
                    },
                };
            `,
        },
        {
            code: codeBlock`
                const store = {
                    set item({ id }) {
                        this.id = id;
                    },
                };
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes setters",
            output: codeBlock`
                const store = {
                    set item(parameter) {
                const { id } = parameter;

                        this.id = id;
                    },
                };
            `,
        },
        {
            code: codeBlock`
                function first(...[item]: string[]) {
                    return item;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "preserves destructured rest parameter array creation",
            output: codeBlock`
                function first(...parameter: string[]) {
                const [item] = parameter;

                    return item;
                }
            `,
        },
        {
            code: codeBlock`
                function length(...{ length }) {
                    return length;
                }
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes destructured object rest parameters",
            output: codeBlock`
                function length(...parameter) {
                const { length } = parameter;

                    return length;
                }
            `,
        },
        {
            code: codeBlock`
                const badge = ({ label }) => <span>{label}</span>;
            `,
            errors: [{ messageId: "destructureInBody" }],
            name: "fixes JSX arrows independently of component detection",
            output: codeBlock`
                const badge = (parameter) => {
                const { label } = parameter;
                return (
                <span>{label}</span>
                );
                };
            `,
        },
        ...[
            {
                code: codeBlock`
                    class Store extends Base {
                        constructor({ id }) {
                            super(id);
                        }
                    }
                `,
                name: "derived constructor initialization order",
            },
            {
                code: codeBlock`
                    const input = {
                        get id() {
                            record("argument");
                            return 1;
                        },
                    };
                    class Store {
                        field = record("field");
                        constructor({ id }) {
                            this.id = id;
                        }
                    }
                    new Store(input);
                `,
                name: "base constructor field initialization order",
            },
            {
                code: codeBlock`
                    function find({ id } = fallback) {
                        return id;
                    }
                `,
                name: "parameter defaults",
            },
            {
                code: codeBlock`
                    function find({ id = fallback }) {
                        return id;
                    }
                `,
                name: "property defaults",
            },
            {
                code: codeBlock`
                    function find([id = fallback]) {
                        return id;
                    }
                `,
                name: "array defaults",
            },
            {
                code: codeBlock`
                    function find({ [key()]: id }) {
                        return id;
                    }
                `,
                name: "computed property keys",
            },
            {
                code: codeBlock`
                    function find({ id }, name = id) {
                        return name;
                    }
                `,
                name: "later initializer dependencies",
            },
            {
                code: codeBlock`
                    function find(name = sideEffect(), { id }) {
                        return id;
                    }
                `,
                name: "earlier initializer side effects",
            },
            {
                code: codeBlock`
                    function find({ id }) {
                        var id;
                        return id;
                    }
                `,
                name: "body redeclarations",
            },
            {
                code: codeBlock`
                    async function find({ id }) {
                        return id;
                    }
                `,
                name: "async error timing",
            },
            {
                code: codeBlock`
                    const find = async ({ id }) => id;
                `,
                name: "async arrow error timing",
            },
            {
                code: codeBlock`
                    function* find({ id }) {
                        yield id;
                    }
                `,
                name: "generator error timing",
            },
            {
                code: codeBlock`
                    function find({ id }) {
                        return arguments[0];
                    }
                `,
                name: "arguments mapping",
            },
            {
                code: codeBlock`
                    function find({ id }) {
                        return eval("id");
                    }
                `,
                name: "dynamic eval scope",
            },
            {
                code: codeBlock`
                    class Store {
                        constructor(public name: string, { id }: Options) {}
                    }
                `,
                name: "constructor parameter properties",
            },
            {
                code: codeBlock`
                    declare function find({ id }: Options): void;
                `,
                name: "ambient declarations",
            },
            {
                code: codeBlock`
                    interface Store {
                        find({ id }: Options): void;
                    }
                `,
                name: "interface methods",
            },
            {
                code: codeBlock`
                    type Find = ({ id }: Options) => void;
                `,
                name: "function types",
            },
            {
                code: codeBlock`
                    type Store = new ([id]: string[]) => object;
                `,
                name: "constructor types",
            },
            {
                code: codeBlock`
                    interface Find {
                        ({ id }: Options): void;
                    }
                `,
                name: "call signatures",
            },
            {
                code: codeBlock`
                    interface Store {
                        new ({ id }: Options): object;
                    }
                `,
                name: "construct signatures",
            },
            {
                code: codeBlock`
                    declare function find({ id }?: Options): void;
                `,
                name: "optional declaration patterns",
            },
            {
                code: codeBlock`
                    abstract class Store {
                        abstract find({ id }: Options): void;
                    }
                `,
                name: "abstract class methods",
            },
            {
                code: codeBlock`
                    class Store {
                        find({ id }: Options): void;
                        find(options: Options) {}
                    }
                `,
                name: "method overloads",
            },
            {
                code: codeBlock`
                    function find({ id }: Options): void;
                    function find(options: Options) {}
                `,
                name: "function overloads",
            },
        ].map(({ code, name }) => ({
            code,
            errors: [{ messageId: "destructureInBody" as const }],
            name: `reports ${name} without an unsafe fix`,
            output: null,
        })),
        {
            code: codeBlock`
                function combine({ first } = one, [second] = two) {
                    return first + second;
                }
            `,
            errors: [
                { messageId: "destructureInBody" },
                { messageId: "destructureInBody" },
            ],
            name: "reports every unsafe pattern in a signature",
            output: null,
        },
    ],
    valid: [
        codeBlock`
            function find(options) {
                const { id } = options;
                return id;
            }
        `,
        codeBlock`
            const find = (options) => options.id;
        `,
        codeBlock`
            const first = (items) => {
                const [item] = items;
                return item;
            };
        `,
        codeBlock`
            items.map((item) => item.id);
        `,
        codeBlock`
            function find(options = {}) {
                return options;
            }
        `,
        codeBlock`
            function all(...parameters) {
                return parameters;
            }
        `,
        codeBlock`
            class Store {
                find(options: Options) {}
            }
        `,
        codeBlock`
            interface Store {
                find(options: Options): void;
            }
        `,
        codeBlock`
            type Find = (options: Options) => void;
        `,
        codeBlock`
            declare function find(options: Options): void;
        `,
        codeBlock`
            class Store {
                constructor(private options: Options) {}
            }
        `,
        codeBlock`
            function fn() {
                const { id } = object;
            }
        `,
    ],
});
