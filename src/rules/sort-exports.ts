import type { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import {
    isInlineExport,
    exportToString,
    toNamedExport,
} from "../utils/export-utils";
import { createRule } from "../utils/rule-utils";
import type { NamedExport } from "../types/named-export";
import isEqual from "lodash/isEqual";

const sortExports = createRule({
    create: (context) => {
        const exports: NamedExport[] = [];

        return {
            ExportNamedDeclaration: (_export): void => {
                if (isInlineExport(_export)) {
                    return;
                }

                exports.push(toNamedExport(_export));
            },
            "Program:exit": (): void => {
                reportErrors(context, exports);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Sorts specifiers in an export statement",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            sortExports: "Expected exports to be sorted",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.SortExports,
});

const reportErrors = (
    context: RuleContext<"sortExports", never[]>,
    exports: NamedExport[]
): void => {
    exports.forEach((_export) => {
        const sortedSpecifiers = sort(_export.specifiers);
        if (isEqual(sortedSpecifiers, _export.specifiers)) {
            return;
        }

        context.report({
            messageId: "sortExports",
            node: _export.reference,
            fix: (fixer) =>
                fixer.replaceText(
                    _export.reference,
                    exportToString({ ..._export, specifiers: sortedSpecifiers })
                ),
        });
    });
};

const sort = (values: string[]): string[] =>
    [...values].sort((left, right) => left.localeCompare(right));

export { sortExports };
