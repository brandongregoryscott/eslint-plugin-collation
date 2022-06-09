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
            output: stripIndent``,
            errors: [{ messageId: "multiComp" }],
        },
    ],
});
