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
            'const Badge = memoize(({ children }) => null); import { memo as memoize } from "react";',

            "const Badge = ({ children }) => <span>{children}</span>;",
            "const Badge = ({ children }) => { return <span>{children}</span>; };",
            "function Badge({ children }) { return <span>{children}</span>; }",
            "const Badge = function ({ children }) { return <span>{children}</span>; };",
            "const Badge = function Named({ children }) { return <span>{children}</span>; };",
            "const Badge = ({ children }: Props) => <span>{children}</span>;",
            "const Badge = <T,>({ children }: Props<T>) => <span>{children}</span>;",
            'const Badge = ({ children = "Default", ...rest }: Props) => <span {...rest}>{children}</span>;',
            "const Badge = ({ children } = {}) => <span>{children}</span>;",
            "const Badge = ({ label: title }) => <span>{title}</span>;",
            "const Badge = ({ children }) => <>{children}</>;",
            "const Badge = ({ visible }) => visible ? <span /> : null;",
            "const Badge = ({ visible }) => visible && <span />;",
            "const Badge = ({ visible }) => <span /> as React.ReactNode;",
            "function Badge({ visible }) { if (visible) { return <span />; } return null; }",
            "export default function ({ children }) { return <span>{children}</span>; }",
            "export default ({ children }) => <span>{children}</span>;",
            "const Badge: React.FC<Props> = ({ children }) => null;",
            "const Badge: React.FunctionComponent<Props> = ({ children }) => null;",
            'import type { FC as Component } from "react"; const Badge: Component<Props> = ({ children }) => null;',
            "const Badge = (({ children }) => <span>{children}</span>) satisfies React.FC<Props>;",
            "const Badge = (({ children }) => <span>{children}</span>) as React.FC<Props>;",
            'import { memo } from "react"; const Badge = memo(({ children }) => <span>{children}</span>);',
            'import { memo as memoize } from "react"; const Badge = memoize(({ children }) => null);',
            'import { forwardRef } from "react"; const Badge = forwardRef(({ children }, ref) => <span ref={ref}>{children}</span>);',
            'import R from "react"; const Badge = R.forwardRef(({ children }, ref) => null);',
            'import * as R from "react"; const Badge = R.memo(({ children }) => null);',
            "const Badge = React.memo(React.forwardRef(({ children }, ref) => <span />));",
        ].map((code) => ({
            code,
            errors: [{ messageId: "destructureInBody" }],
        })),
    }
);
