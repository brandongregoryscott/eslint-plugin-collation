import { ESLintUtils } from "@typescript-eslint/utils";
import { getDocsUrl } from "./docs-utils";

const createRule = ESLintUtils.RuleCreator(getDocsUrl);

export { createRule };
