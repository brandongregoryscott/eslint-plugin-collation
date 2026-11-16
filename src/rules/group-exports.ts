import type { CommentedNode } from "../utils/comment-utils";
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
import first from "lodash/first";
import keyBy from "lodash/keyBy";
import last from "lodash/last";

type StatementGroups = Record<number, CommentedNode>;

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

    const statements = getExportStatementGroups(exports, sourceCode);
    const replacement = getConsolidatedExportText(
        exports,
        lastExport,
        statements,
        sourceCode
    );

    return exports.map((_export) => {
        const isLast = _export === lastExport;
        const range = getExportFixRange(
            _export.reference,
            statements[_export.reference.range[0]],
            sourceCode,
            !isLast
        );
        return fixer.replaceTextRange(range, isLast ? replacement : "");
    });
};

/** Associate statement comments without including file headers or footers. */
const getExportStatementGroups = (
    exports: NamedExport[],
    sourceCode: SourceCode
): StatementGroups => {
    const reference = last(exports)?.reference;
    if (reference == null) {
        return {};
    }

    const parent = reference.parent;
    const body =
        parent.type === AST_NODE_TYPES.Program ||
        parent.type === AST_NODE_TYPES.TSModuleBlock
            ? parent.body
            : exports.map((_export) => _export.reference);
    const firstStatement = first(body);
    const lastStatement = last(body);
    const trailing =
        lastStatement == null
            ? []
            : sourceCode
                  .getCommentsAfter(lastStatement)
                  .filter(
                      (comment) =>
                          comment.loc.start.line === lastStatement.loc.end.line
                  );

    // Newer parsers include file-level comments in Program ranges.
    const isProgram = parent.type === AST_NODE_TYPES.Program;
    const range: TSESTree.Range = [
        isProgram
            ? firstStatement?.range[0] ?? parent.range[0]
            : parent.range[0],
        Math.max(
            isProgram
                ? lastStatement?.range[1] ?? parent.range[1]
                : parent.range[1],
            last(trailing)?.range[1] ?? 0
        ),
    ];
    return keyBy(
        groupNodesWithComments(body, range, sourceCode),
        ({ node }) => node.range[0]
    );
};

/** Transfer statement comments to their specifiers, retaining empty-list comments. */
const getExportSpecifierGroups = (
    exports: NamedExport[],
    retainedExport: NamedExport,
    statements: StatementGroups,
    sourceCode: SourceCode
): {
    emptyListComments: TSESTree.Comment[];
    specifiers: CommentedNode<TSESTree.ExportSpecifier>[];
} => {
    const specifiers: CommentedNode<TSESTree.ExportSpecifier>[] = [];
    const emptyListComments: TSESTree.Comment[] = [];

    for (const _export of exports) {
        const reference = _export.reference;
        // The retained declaration keeps comments outside its braces in place.
        const range =
            _export === retainedExport
                ? getExportListRange(reference, sourceCode)
                : reference.range;
        const items = groupNodesWithComments(
            reference.specifiers,
            range,
            sourceCode
        );
        const statement = statements[reference.range[0]];

        if (items.length === 0) {
            emptyListComments.push(
                ...(statement?.leading ?? []),
                ...sourceCode
                    .getCommentsInside(reference)
                    .filter(
                        (comment) =>
                            comment.range[0] >= range[0] &&
                            comment.range[1] <= range[1]
                    ),
                ...(statement?.trailing ?? [])
            );
        } else {
            first(items)?.leading.unshift(...(statement?.leading ?? []));
            last(items)?.trailing.push(...(statement?.trailing ?? []));
            specifiers.push(...items);
        }
    }

    first(specifiers)?.leading.unshift(...emptyListComments);
    return { emptyListComments, specifiers };
};

/** Replace only the retained declaration's list, preserving its surrounding source. */
const getConsolidatedExportText = (
    exports: NamedExport[],
    retainedExport: NamedExport,
    statements: StatementGroups,
    sourceCode: SourceCode
): string => {
    const reference = retainedExport.reference;
    const range = getExportListRange(reference, sourceCode);
    const { specifiers, emptyListComments } = getExportSpecifierGroups(
        exports,
        retainedExport,
        statements,
        sourceCode
    );
    const content =
        specifiers.length === 0 && emptyListComments.length > 0
            ? "\n" + printComments(emptyListComments, sourceCode) + "\n"
            : printCommentedList(specifiers, sourceCode, true, range);

    return (
        sourceCode.text.slice(reference.range[0], range[0]) +
        content +
        sourceCode.text.slice(range[1], reference.range[1])
    );
};

/** Include attached comments and, for removed declarations, following whitespace. */
const getExportFixRange = (
    reference: TSESTree.ExportNamedDeclaration,
    statement: CommentedNode | undefined,
    sourceCode: SourceCode,
    removeFollowingWhitespace: boolean
): TSESTree.Range => {
    const start = first(statement?.leading)?.range[0] ?? reference.range[0];
    const endToken = last(statement?.trailing) ?? reference;
    let end = endToken.range[1];

    if (removeFollowingWhitespace) {
        const next = sourceCode.getTokenAfter(endToken, {
            includeComments: true,
        });
        if (
            next != null &&
            sourceCode.text.slice(end, next.range[0]).trim() === ""
        ) {
            end = next.range[0];
        }
    }

    return [start, end];
};

/**
 * Group exports by kind (type or value) as well as the module they are exported from
 * Any groups that contain more than 1 export will have their specifiers consolidated into one
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
