import { ESLintUtils } from "@typescript-eslint/utils";
import { multiComp } from "./multi-comp";
import { stripIndent } from "common-tags";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
});

ruleTester.run("multiComp", multiComp, {
    valid: [
        {
            name: "should not report errors when single component exists",
            code: stripIndent`
                const App = () => {
                    return <div />;
                };
            `,
        },
    ],
    invalid: [
        {
            name: "should report errors when multiple components exist",
            filename: "app.tsx",
            code: stripIndent`
                const App = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp" }],
        },
        {
            name: "should report error on non-primary component when default export exists",
            code: stripIndent`
                const App = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }

                export default App;
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
        {
            name: "should report error on non-primary component when filename matches case-insensitive",
            filename: "app.tsx",
            code: stripIndent`
                const App = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
        {
            name: "should report error on non-primary component when kebabCase filename matches",
            filename: "my-app.tsx",
            code: stripIndent`
                const MyApp = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
        {
            name: "should report error on non-primary component when snakeCase filename matches",
            filename: "my_app.tsx",
            code: stripIndent`
                const MyApp = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
        {
            name: "should report error on non-primary component when camelCase filename matches",
            filename: "myApp.tsx",
            code: stripIndent`
                const MyApp = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
        {
            name: "should report error on non-primary component when it appears as inline export",
            code: stripIndent`
                export const App = () => {
                    return <Row />;
                }

                export const Row = () => {
                    return <div />;
                }
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },

        {
            only: true,
            name: "should report error on non-primary component when it appears in export statement",
            code: stripIndent`
                const App = () => {
                    return <Row />;
                }

                const Row = () => {
                    return <div />;
                }

                export { App, Row };
            `,
            errors: [{ messageId: "multiComp", line: 5 }],
        },
    ],
});
