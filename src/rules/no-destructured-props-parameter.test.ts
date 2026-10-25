import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noDestructuredPropsParameter } from "./no-destructured-props-parameter";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run(
    "no-destructured-props-parameter",
    noDestructuredPropsParameter,
    {
        valid: [
            'import { memo } from "react"; function helper(memo) { return memo(({ value }) => value); }',
            "function helper(React) { return React.memo(({ value }) => value); }",
            'import React from "other"; const value = React.memo(({ value }) => value);',

            'import { memo } from "react"; const Badge = memo(Component, ({ value }, next) => value === next.value);',
            "const Badge = React.memo(Component, ({ value }, next) => value === next.value);",
            "const Badge: FC<Props> = ({ value }) => null;",

            "const Badge = (props) => { const { children } = props; return <span>{children}</span>; };",
            "function Badge(props) { return <span>{props.children}</span>; }",
            "const Badge = () => <span />;",
            "const helper = ({ value }) => value;",
            "function Helper({ value }) { return value; }",
            "const renderItem = ({ value }) => <span>{value}</span>;",
            "items.map(({ value }) => <span>{value}</span>);",
            "const Badge = (props) => items.map(({ value }) => <span>{value}</span>);",
            "function Helper({ value }) { function Inner() { return <span />; } return value; }",
            "function Helper({ value }) { const render = () => <span />; return value; }",
            "function Helper({ value }) { const element = <span />; return value; }",
            "function Helper({ value }) { return { element: <span /> }; }",
            "class Badge { render({ value }) { return <span />; } }",
            "const Component = (props, { value }) => <span />;",
            "const value = other.memo(({ value }) => value);",
            'import { memo } from "other"; const value = memo(({ value }) => value);',
            'import { memo } from "react"; const Badge = memo((props) => { const { children } = props; return <span>{children}</span>; });',
            "const Badge: React.FC<Props> = (props) => { const { children } = props; return null; };",
        ],
        invalid: [
            {
                code: "const Badge = ({ children } // keep\n: Props) => <span />;",
                output: "const Badge = (props: Props) => {\nconst { children } // keep\n = props;\nreturn (\n<span />\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ value }) => { value += 1; return <span>{value}</span>; };",
                output: "const Badge = (props) => {\nlet { value } = props;\n value += 1; return <span>{value}</span>; };",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ value }) => { const bump = () => value++; bump(); return <span>{value}</span>; };",
                output: "const Badge = (props) => {\nlet { value } = props;\n const bump = () => value++; bump(); return <span>{value}</span>; };",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ value }) => <span>{props.value}{value}</span>;",
                output: "const Badge = (props2) => {\nconst { value } = props2;\nreturn (\n<span>{props.value}{value}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ props, props2 }) => <span>{props}{props2}</span>;",
                output: "const Badge = (props3) => {\nconst { props, props2 } = props3;\nreturn (\n<span>{props}{props2}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ user: { name }, values: [first] }) => <span>{name}{first}</span>;",
                output: "const Badge = (props) => {\nconst { user: { name }, values: [first] } = props;\nreturn (\n<span>{name}{first}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ /* keep */ children }: Props) => (<span>{children}</span>);",
                output: "const Badge = (props: Props) => {\nconst { /* keep */ children } = props;\nreturn (\n(<span>{children}</span>)\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'function Badge({ children }) { "use client"; return <span>{children}</span>; }',
                output: 'function Badge(props) { "use client";\nconst { children } = props;\n return <span>{children}</span>; }',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ children }) => // keep\n(<span>{children}</span>);",
                output: "const Badge = (props) => {\nconst { children } = props;\nreturn (\n// keep\n(<span>{children}</span>)\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ [getKey()]: value }) => <span>{value}</span>;",
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: "const Badge = (props) => {\nconst { [getKey()]: value } = props;\nreturn (\n<span>{value}</span>\n);\n};",
                            },
                        ],
                    },
                ],
            },
            {
                code: "function Badge({ value }, ref = getRef()) { return <span>{value}</span>; }",
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: "function Badge(props, ref = getRef()) {\nconst { value } = props;\n return <span>{value}</span>; }",
                            },
                        ],
                    },
                ],
            },
            {
                code: "function Badge({ value }, ref = value) { return <span>{value}</span>; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: "function Badge({ value }) { var value; return <span>{value}</span>; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: "function Badge({ value }) { function value() {} return <span />; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: "function Badge({ value }) { return <span>{arguments[0].value}</span>; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: 'function Badge({ value }) { eval("value = 1"); return <span>{value}</span>; }',
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: "function* Badge({ value }) { yield 1; return <span>{value}</span>; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: "async function Badge({ value }) { return <span>{value}</span>; }",
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },

            {
                code: "const Badge = ({ children }) => <span>{children}</span>;",
                output: "const Badge = (props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ children }) => { return <span>{children}</span>; };",
                output: "const Badge = (props) => {\nconst { children } = props;\n return <span>{children}</span>; };",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "function Badge({ children }) { return <span>{children}</span>; }",
                output: "function Badge(props) {\nconst { children } = props;\n return <span>{children}</span>; }",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = function ({ children }) { return <span>{children}</span>; };",
                output: "const Badge = function (props) {\nconst { children } = props;\n return <span>{children}</span>; };",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = function Named({ children }) { return <span>{children}</span>; };",
                output: "const Badge = function Named(props) {\nconst { children } = props;\n return <span>{children}</span>; };",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ children }: Props) => <span>{children}</span>;",
                output: "const Badge = (props: Props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = <T,>({ children }: Props<T>) => <span>{children}</span>;",
                output: "const Badge = <T,>(props: Props<T>) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'const Badge = ({ children = "Default", ...rest }: Props) => <span {...rest}>{children}</span>;',
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: 'const Badge = (props: Props) => {\nconst { children = "Default", ...rest } = props;\nreturn (\n<span {...rest}>{children}</span>\n);\n};',
                            },
                        ],
                    },
                ],
            },
            {
                code: "const Badge = ({ children } = {}) => <span>{children}</span>;",
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: "const Badge = (props = {}) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n};",
                            },
                        ],
                    },
                ],
            },
            {
                code: "const Badge = ({ label: title, ...rest }) => <span {...rest}>{title}</span>;",
                output: "const Badge = (props) => {\nconst { label: title, ...rest } = props;\nreturn (\n<span {...rest}>{title}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ children }) => <>{children}</>;",
                output: "const Badge = (props) => {\nconst { children } = props;\nreturn (\n<>{children}</>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ visible }) => visible ? <span /> : null;",
                output: "const Badge = (props) => {\nconst { visible } = props;\nreturn (\nvisible ? <span /> : null\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ visible }) => visible && <span />;",
                output: "const Badge = (props) => {\nconst { visible } = props;\nreturn (\nvisible && <span />\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = ({ visible }) => <span /> as React.ReactNode;",
                output: "const Badge = (props) => {\nconst { visible } = props;\nreturn (\n<span /> as React.ReactNode\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "function Badge({ visible }) { if (visible) { return <span />; } return null; }",
                output: "function Badge(props) {\nconst { visible } = props;\n if (visible) { return <span />; } return null; }",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "export default function ({ children }) { return <span>{children}</span>; }",
                output: "export default function (props) {\nconst { children } = props;\n return <span>{children}</span>; }",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "export default ({ children }) => <span>{children}</span>;",
                output: "export default (props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge: React.FC<Props> = ({ children }) => null;",
                output: "const Badge: React.FC<Props> = (props) => {\nconst { children } = props;\nreturn (\nnull\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge: React.FunctionComponent<Props> = ({ children }) => null;",
                output: "const Badge: React.FunctionComponent<Props> = (props) => {\nconst { children } = props;\nreturn (\nnull\n);\n};",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'import type { FC as Component } from "react"; const Badge: Component<Props> = ({ children }) => null;',
                output: 'import type { FC as Component } from "react"; const Badge: Component<Props> = (props) => {\nconst { children } = props;\nreturn (\nnull\n);\n};',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = (({ children }) => <span>{children}</span>) satisfies React.FC<Props>;",
                output: "const Badge = ((props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n}) satisfies React.FC<Props>;",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = (({ children }) => <span>{children}</span>) as React.FC<Props>;",
                output: "const Badge = ((props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n}) as React.FC<Props>;",
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'import { memo } from "react"; const Badge = memo(({ children }) => <span>{children}</span>);',
                output: 'import { memo } from "react"; const Badge = memo((props) => {\nconst { children } = props;\nreturn (\n<span>{children}</span>\n);\n});',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'const Badge = memoize(({ children }) => null); import { memo as memoize } from "react";',
                output: 'const Badge = memoize((props) => {\nconst { children } = props;\nreturn (\nnull\n);\n}); import { memo as memoize } from "react";',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'import { forwardRef } from "react"; const Badge = forwardRef(({ children }, ref) => <span ref={ref}>{children}</span>);',
                output: 'import { forwardRef } from "react"; const Badge = forwardRef((props, ref) => {\nconst { children } = props;\nreturn (\n<span ref={ref}>{children}</span>\n);\n});',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'import R from "react"; const Badge = R.forwardRef(({ children }, ref) => null);',
                output: 'import R from "react"; const Badge = R.forwardRef((props, ref) => {\nconst { children } = props;\nreturn (\nnull\n);\n});',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: 'import * as R from "react"; const Badge = R.memo(({ children }) => null);',
                output: 'import * as R from "react"; const Badge = R.memo((props) => {\nconst { children } = props;\nreturn (\nnull\n);\n});',
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: "const Badge = React.memo(React.forwardRef(({ children }, ref) => <span />));",
                output: "const Badge = React.memo(React.forwardRef((props, ref) => {\nconst { children } = props;\nreturn (\n<span />\n);\n}));",
                errors: [{ messageId: "destructureInBody" }],
            },
        ],
    }
);
