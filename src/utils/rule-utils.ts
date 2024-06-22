import { ESLintUtils } from "@typescript-eslint/utils";
import { getDocsUrl } from "./string-utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

const createRule = ESLintUtils.RuleCreator(getDocsUrl);

const tryRule = <TMessageIds extends string, TOptions extends unknown[]>(
    context: RuleContext<TMessageIds, TOptions>,
    fn: () => void
) => {
    try {
        fn();
    } catch (error) {
        const prefix = `collation/${context.id}`;
        const filename = context.getFilename();
        console.error(`${prefix}: Error while linting ${filename}`, error);
    }
};

export { createRule, tryRule };
