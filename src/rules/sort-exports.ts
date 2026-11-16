import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import { RuleName } from "../enums/rule-name";
import {
    getExportListRange,
    isInlineExport,
    toNamedExport,
} from "../utils/export-utils";
import { createRule } from "../utils/rule-utils";
import {
    groupNodesWithComments,
    printCommentedList,
} from "../utils/comment-utils";
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
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    exports.forEach((_export) => {
        const sortedSpecifiers = sort(_export.specifiers);
        if (isEqual(sortedSpecifiers, _export.specifiers)) {
            return;
        }

        context.report({
            messageId: "sortExports",
            node: _export.reference,
            fix: (fixer) => {
                const range = getExportListRange(_export.reference, sourceCode);
                const keys = new Map(
                    _export.reference.specifiers.map((node, index) => [
                        node,
                        _export.specifiers[index],
                    ])
                );
                const groups = groupNodesWithComments(
                    _export.reference.specifiers,
                    range,
                    sourceCode
                ).sort((left, right) =>
                    (keys.get(left.node) ?? "").localeCompare(
                        keys.get(right.node) ?? ""
                    )
                );
                return fixer.replaceTextRange(
                    range,
                    printCommentedList(groups, sourceCode, true, range)
                );
            },
        });
    });
};

const sort = (values: string[]): string[] =>
    [...values].sort((left, right) => left.localeCompare(right));

export { sortExports };
