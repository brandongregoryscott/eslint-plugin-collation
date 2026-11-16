import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import type { TSESTree } from "@typescript-eslint/utils";
import type { NamedExport } from "../types/named-export";
import { isEmpty } from "./core-utils";
import { isIdentifier } from "./node-utils";

const getSpecifiers = (_export: TSESTree.ExportNamedDeclaration): string[] =>
    _export.specifiers.map((specifier) => {
        const local = isIdentifier(specifier.local)
            ? specifier.local.name
            : specifier.local.value;
        const exported = isIdentifier(specifier.exported)
            ? specifier.exported.name
            : specifier.exported.value;
        return exported === local ? local : `${local} as ${exported}`;
    });

const isInlineExport = (
    namedExport: TSESTree.ExportNamedDeclaration
): boolean =>
    isEmpty(namedExport.specifiers) && namedExport.declaration != null;

const toNamedExport = (
    _export: TSESTree.ExportNamedDeclaration
): NamedExport => ({
    kind: _export.exportKind,
    module: _export.source?.value,
    reference: _export,
    specifiers: getSpecifiers(_export),
});

const getExportListRange = (
    node: TSESTree.ExportNamedDeclaration,
    sourceCode: SourceCode
): TSESTree.Range => {
    const open = sourceCode.getFirstToken(node, (token) => token.value === "{");
    const close =
        open == null
            ? null
            : sourceCode.getTokenAfter(
                  node.specifiers[node.specifiers.length - 1] ?? open,
                  (token) => token.value === "}"
              );
    if (open == null || close == null) {
        throw new Error("Expected a named export list");
    }
    return [open.range[1], close.range[0]];
};

export { getExportListRange, isInlineExport, toNamedExport };
