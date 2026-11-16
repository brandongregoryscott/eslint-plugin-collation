import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/brandongregoryscott/eslint-plugin-collation/blob/main/documentation/docs/rules/${name}.md`
);

export { createRule };
