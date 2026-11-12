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
    valid: [
        "function find(options) { const { id } = options; return id; }",
        "const find = (options) => options.id;",
        "const first = (items) => { const [item] = items; return item; };",
        "items.map((item) => item.id);",
        "function find(options = {}) { return options; }",
        "function all(...parameters) { return parameters; }",
        "class Store { find(options: Options) {} }",
        "interface Store { find(options: Options): void; }",
        "type Find = (options: Options) => void;",
        "declare function find(options: Options): void;",
        "class Store { constructor(private options: Options) {} }",
        "function fn() { const { id } = object; }",
    ],
    invalid: [
        {
            name: "fixes an ordinary function declaration",
            code: "function find({ id }: Options) { return id; }",
            output: "function find(parameter: Options) {\nconst { id } = parameter;\n return id; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes anonymous function callbacks",
            code: "items.map(function ({ id }) { return id; });",
            output: "items.map(function (parameter) {\nconst { id } = parameter;\n return id; });",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes an expression-bodied arrow callback",
            code: "items.map(({ id }) => id);",
            output: "items.map((parameter) => {\nconst { id } = parameter;\nreturn (\nid\n);\n});",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "keeps a parenthesized object expression in the return",
            code: "const find = ({ id }) => ({ id });",
            output: "const find = (parameter) => {\nconst { id } = parameter;\nreturn (\n({ id })\n);\n};",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes array parameters",
            code: "function first([item, ...rest]: string[]) { return item; }",
            output: "function first(parameter: string[]) {\nconst [item, ...rest] = parameter;\n return item; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "moves multiple parameters atomically in their original order",
            code: "function combine({ first }, [second], last) { return first + second + last; }",
            output: "function combine(parameter, parameter2, last) {\nconst { first } = parameter;\nconst [second] = parameter2;\n return first + second + last; }",
            errors: [
                { messageId: "destructureInBody" },
                { messageId: "destructureInBody" },
            ],
        },
        {
            name: "checks parameters beyond the first",
            code: "function find(prefix, { id }) { return prefix + id; }",
            output: "function find(prefix, parameter) {\nconst { id } = parameter;\n return prefix + id; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "preserves aliases, nested destructuring, rest properties, and comments",
            code: "function find({ id: value, nested: { name }, /* rest */ ...rest }: Options) { return value; }",
            output: "function find(parameter: Options) {\nconst { id: value, nested: { name }, /* rest */ ...rest } = parameter;\n return value; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "chooses a name that cannot capture existing references",
            code: "function find({ id }, parameter) { return () => parameter2 + id; }",
            output: "function find(parameter3, parameter) {\nconst { id } = parameter3;\n return () => parameter2 + id; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "preserves writes to the destructured binding",
            code: "function find({ id }) { id++; return id; }",
            output: "function find(parameter) {\nlet { id } = parameter;\n id++; return id; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "preserves directive prologues",
            code: 'function find({ id }) { "use custom"; return id; }',
            output: 'function find(parameter) { "use custom";\nconst { id } = parameter;\n return id; }',
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes static and ordinary class methods",
            code: "class Store { static find({ id }: Options) { return id; } }",
            output: "class Store { static find(parameter: Options) {\nconst { id } = parameter;\n return id; } }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes object methods",
            code: "const store = { find({ id }) { return id; } };",
            output: "const store = { find(parameter) {\nconst { id } = parameter;\n return id; } };",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes setters",
            code: "const store = { set item({ id }) { this.id = id; } };",
            output: "const store = { set item(parameter) {\nconst { id } = parameter;\n this.id = id; } };",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "preserves destructured rest parameter array creation",
            code: "function first(...[item]: string[]) { return item; }",
            output: "function first(...parameter: string[]) {\nconst [item] = parameter;\n return item; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes destructured object rest parameters",
            code: "function length(...{ length }) { return length; }",
            output: "function length(...parameter) {\nconst { length } = parameter;\n return length; }",
            errors: [{ messageId: "destructureInBody" }],
        },
        {
            name: "fixes JSX arrows independently of component detection",
            code: "const badge = ({ label }) => <span>{label}</span>;",
            output: "const badge = (parameter) => {\nconst { label } = parameter;\nreturn (\n<span>{label}</span>\n);\n};",
            errors: [{ messageId: "destructureInBody" }],
        },
        ...[
            {
                name: "derived constructor initialization order",
                code: "class Store extends Base { constructor({ id }) { super(id); } }",
            },
            {
                name: "base constructor field initialization order",
                code: "const input = { get id() { record('argument'); return 1; } }; class Store { field = record('field'); constructor({ id }) { this.id = id; } } new Store(input);",
            },
            {
                name: "parameter defaults",
                code: "function find({ id } = fallback) { return id; }",
            },
            {
                name: "property defaults",
                code: "function find({ id = fallback }) { return id; }",
            },
            {
                name: "array defaults",
                code: "function find([id = fallback]) { return id; }",
            },
            {
                name: "computed property keys",
                code: "function find({ [key()]: id }) { return id; }",
            },
            {
                name: "later initializer dependencies",
                code: "function find({ id }, name = id) { return name; }",
            },
            {
                name: "earlier initializer side effects",
                code: "function find(name = sideEffect(), { id }) { return id; }",
            },
            {
                name: "body redeclarations",
                code: "function find({ id }) { var id; return id; }",
            },
            {
                name: "async error timing",
                code: "async function find({ id }) { return id; }",
            },
            {
                name: "async arrow error timing",
                code: "const find = async ({ id }) => id;",
            },
            {
                name: "generator error timing",
                code: "function* find({ id }) { yield id; }",
            },
            {
                name: "arguments mapping",
                code: "function find({ id }) { return arguments[0]; }",
            },
            {
                name: "dynamic eval scope",
                code: "function find({ id }) { return eval('id'); }",
            },
            {
                name: "constructor parameter properties",
                code: "class Store { constructor(public name: string, { id }: Options) {} }",
            },
            {
                name: "ambient declarations",
                code: "declare function find({ id }: Options): void;",
            },
            {
                name: "interface methods",
                code: "interface Store { find({ id }: Options): void; }",
            },
            {
                name: "function types",
                code: "type Find = ({ id }: Options) => void;",
            },
            {
                name: "constructor types",
                code: "type Store = new ([id]: string[]) => object;",
            },
            {
                name: "call signatures",
                code: "interface Find { ({ id }: Options): void; }",
            },
            {
                name: "construct signatures",
                code: "interface Store { new ({ id }: Options): object; }",
            },
            {
                name: "optional declaration patterns",
                code: "declare function find({ id }?: Options): void;",
            },
            {
                name: "abstract class methods",
                code: "abstract class Store { abstract find({ id }: Options): void; }",
            },
            {
                name: "method overloads",
                code: "class Store { find({ id }: Options): void; find(options: Options) {} }",
            },
            {
                name: "function overloads",
                code: "function find({ id }: Options): void; function find(options: Options) {}",
            },
        ].map(({ name, code }) => ({
            name: `reports ${name} without an unsafe fix`,
            code,
            output: null,
            errors: [{ messageId: "destructureInBody" as const }],
        })),
        {
            name: "reports every unsafe pattern in a signature",
            code: codeBlock`
                function combine({ first } = one, [second] = two) {
                    return first + second;
                }
            `,
            output: null,
            errors: [
                { messageId: "destructureInBody" },
                { messageId: "destructureInBody" },
            ],
        },
    ],
});
