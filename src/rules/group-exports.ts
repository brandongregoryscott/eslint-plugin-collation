import type { TSESTree } from "@typescript-eslint/utils";
import type {
    RuleContext,
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import last from "lodash/last";
import { isInlineExport } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";
import dropRight from "lodash/dropRight";
import groupBy from "lodash/groupBy";
import isEmpty from "lodash/isEmpty";
import { removeNodeAndNewLine } from "../utils/fixer-utils";

interface NamedExport {
    kind: "type" | "value";
    module: string | undefined;
    reference: TSESTree.ExportNamedDeclaration;
    specifiers: string[];
}

const groupExports = createRule({
    create: (context) => {
        const exports: NamedExport[] = [];

        return {
            ExportNamedDeclaration: (namedExport): void => {
                if (isInlineExport(namedExport)) {
                    return;
                }

                exports.push({
                    kind: namedExport.exportKind,
                    module: namedExport.source?.value,
                    reference: namedExport,
                    specifiers: getSpecifiers(namedExport),
                });
            },
            "Program:exit": (): void => {
                const sourceCode = context.getSourceCode();
                const groupedExports = groupExportsByTypeAndModule(exports);
                reportErrors(groupedExports, sourceCode, context);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Consolidates multiple export statements",
            recommended: "warn",
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

/**
 * Converts multiple named exports into a string representation of a single export. This function
 * assumes the exports are all the same kind, for the same module and the array contains at least two entries
 */
const consolidateExportsToString = (exports: NamedExport[]): string => {
    const _export = last(exports)!;
    _export.specifiers = exports.flatMap((_export) => _export.specifiers);

    return exportToString(_export);
};

const exportToString = (_export: NamedExport): string => {
    const { kind, module } = _export;

    const exportKeyword = kind === "type" ? "export type" : "export";
    const specifierList = _export.specifiers.join(", ");

    const moduleSpecifier = isEmpty(module) ? "" : ` from "${module}"`;

    return `${exportKeyword} { ${specifierList} }${moduleSpecifier};`;
};

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

const getSpecifiers = (
    namedExport: TSESTree.ExportNamedDeclaration
): string[] =>
    namedExport.specifiers.map((specifier) => {
        const { exported, local } = specifier;
        if (exported.name !== local.name) {
            return `${local.name} as ${exported.name}`;
        }
        return local.name;
    });

const getFixesForExports = (
    fixer: RuleFixer,
    exports: NamedExport[],
    sourceCode: SourceCode
): RuleFix[] => {
    if (exports.length < 2) {
        return [];
    }

    const lastExport = last(exports)!;
    const consolidatedExport = consolidateExportsToString(exports);
    return [
        fixer.insertTextAfter(lastExport.reference, consolidatedExport),
        ...exports.flatMap((_export, index) =>
            index === exports.length - 1
                ? fixer.remove(_export.reference)
                : removeNodeAndNewLine(fixer, _export.reference, sourceCode)
        ),
    ];
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
    exports: NamedExport[],
    groupedExports: Record<string, NamedExport[]>,
    sourceCode: SourceCode,
    context: RuleContext<"groupExports", never[]>
): void => {
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
    groupedExports: Record<string, NamedExport[]>,
    sourceCode: SourceCode,
    context: RuleContext<"groupExports", never[]>
): void => {
    Object.values(groupedExports).forEach((exports) =>
        reportErrorsForExtraExports(
            exports,
            groupedExports,
            sourceCode,
            context
        )
    );
};

export { groupExports };
