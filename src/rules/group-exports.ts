import {
    groupNodesWithComments,
    printCommentedList,
    printComments,
} from "../utils/comment-utils";
import type {
    RuleContext,
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/ts-eslint";
import { RuleName } from "../enums/rule-name";
import {
    isInlineExport,
    getExportListRange,
    toNamedExport,
} from "../utils/export-utils";
import { createRule } from "../utils/rule-utils";
import dropRight from "lodash/dropRight";
import groupBy from "lodash/groupBy";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { NamedExport } from "../types/named-export";
import { last } from "../utils/collection-utils";

const groupExports = createRule({
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
                const groupedExports = groupExportsByTypeAndModule(exports);
                reportErrors(context, groupedExports);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Consolidates multiple export statements",
        },
        fixable: "code",
        messages: {
            groupExports: "Expected export statement to be grouped",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.GroupExports,
});

const fixUngroupedExports = (
    fixer: RuleFixer,
    exports: Record<string, NamedExport[]>,
    sourceCode: SourceCode
): RuleFix[] => {
    const fixes = Object.values(exports).flatMap((exports) =>
        getFixesForExports(fixer, exports, sourceCode)
    );

    return fixes;
};

const getFixesForExports = (
    fixer: RuleFixer,
    exports: NamedExport[],
    sourceCode: SourceCode
): RuleFix[] => {
    const lastExport = last(exports);
    if (exports.length < 2 || lastExport == null) {
        return [];
    }

    const range = getExportListRange(lastExport.reference, sourceCode);
    const parent = lastExport.reference.parent;
    const body =
        parent.type === AST_NODE_TYPES.Program ||
        parent.type === AST_NODE_TYPES.TSModuleBlock
            ? parent.body
            : exports.map((_export) => _export.reference);
    const lastStatement = body[body.length - 1];
    const trailing =
        lastStatement == null
            ? []
            : sourceCode
                  .getCommentsAfter(lastStatement)
                  .filter(
                      (comment) =>
                          comment.loc.start.line === lastStatement.loc.end.line
                  );
    const statementRange: TSESTree.Range = [
        parent.range[0],
        Math.max(parent.range[1], trailing[trailing.length - 1]?.range[1] ?? 0),
    ];
    const statements = groupNodesWithComments(body, statementRange, sourceCode);
    const orphans: TSESTree.Comment[] = [];
    const groups = exports.flatMap((_export) => {
        const reference = _export.reference;
        const listRange = getExportListRange(reference, sourceCode);
        const items = groupNodesWithComments(
            reference.specifiers,
            _export === lastExport ? listRange : reference.range,
            sourceCode
        );
        const statement = statements.find((item) => item.node === reference);
        if (items.length === 0) {
            orphans.push(
                ...(statement?.leading ?? []),
                ...sourceCode
                    .getCommentsInside(reference)
                    .filter(
                        (comment) =>
                            _export !== lastExport ||
                            (comment.range[0] >= listRange[0] &&
                                comment.range[1] <= listRange[1])
                    ),
                ...(statement?.trailing ?? [])
            );
        } else {
            items[0].leading.unshift(...(statement?.leading ?? []));
            items[items.length - 1].trailing.push(
                ...(statement?.trailing ?? [])
            );
        }
        return items;
    });
    groups[0]?.leading.unshift(...orphans);
    const content =
        groups.length === 0 && orphans.length > 0
            ? "\n" + printComments(orphans, sourceCode) + "\n"
            : printCommentedList(groups, sourceCode, true, range);
    const replacement =
        sourceCode.text.slice(lastExport.reference.range[0], range[0]) +
        content +
        sourceCode.text.slice(range[1], lastExport.reference.range[1]);
    return exports.map((_export, index) => {
        const reference = _export.reference;
        const statement = statements.find((item) => item.node === reference);
        const first = statement?.leading[0] ?? reference;
        const last =
            statement?.trailing[statement.trailing.length - 1] ?? reference;
        let end = last.range[1];
        if (index !== exports.length - 1) {
            const next = sourceCode.getTokenAfter(last, {
                includeComments: true,
            });
            if (
                next != null &&
                sourceCode.text.slice(end, next.range[0]).trim() === ""
            ) {
                end = next.range[0];
            }
        }
        return fixer.replaceTextRange(
            [first.range[0], end],
            index === exports.length - 1 ? replacement : ""
        );
    });
};

/**
 * Group exports by kind (type or value) as well as the module they are exported from
 *  ny groups that contain more than 1 export will have their specifiers consolidated into one
 */
const groupExportsByTypeAndModule = (
    exports: NamedExport[]
): Record<string, NamedExport[]> =>
    groupBy(exports, (_export) => [_export.kind, _export.module].join());

const reportErrorsForExtraExports = (
    context: RuleContext<"groupExports", never[]>,
    exports: NamedExport[],
    groupedExports: Record<string, NamedExport[]>
): void => {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const extraExports = dropRight(exports, 1);
    extraExports.forEach((_export) => {
        context.report({
            node: _export.reference,
            messageId: "groupExports",
            fix: (fixer) =>
                fixUngroupedExports(fixer, groupedExports, sourceCode),
        });
    });
};

const reportErrors = (
    context: RuleContext<"groupExports", never[]>,
    groupedExports: Record<string, NamedExport[]>
): void => {
    Object.values(groupedExports).forEach((exports) =>
        reportErrorsForExtraExports(context, exports, groupedExports)
    );
};

export { groupExports };
