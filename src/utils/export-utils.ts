import type { TSESTree } from "@typescript-eslint/utils";
import type { NamedExport } from "../types/named-export";
import { last } from "./collection-utils";
import { isEmpty } from "./core-utils";
import { compact } from "lodash";
import { isIdentifier } from "./node-utils";

/**
 * Converts multiple named exports into a single export. This function
 * assumes the exports are all the same kind, for the same module and the array contains at least two entries
 */
const consolidateExports = (exports: NamedExport[]): NamedExport => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastExport = last(exports)!;
    const { kind, module, reference } = lastExport;
    const consolidatedExport: NamedExport = {
        specifiers: exports.flatMap((_export) => _export.specifiers),
        reference,
        kind,
        module,
    };

    return consolidatedExport;
};

const exportToString = (_export: NamedExport): string => {
    const { kind, module } = _export;

    const exportKeyword = kind === "type" ? "export type" : "export";
    const specifierList = _export.specifiers.join(", ");

    const moduleSpecifier = isEmpty(module) ? "" : ` from "${module}"`;

    return `${exportKeyword} { ${specifierList} }${moduleSpecifier};`;
};

const getSpecifiers = (_export: TSESTree.ExportNamedDeclaration): string[] => {
    const specifiers = _export.specifiers.map((specifier) => {
        const { exported, local } = specifier;

        if (!isIdentifier(exported) || !isIdentifier(local)) {
            return "";
        }

        if (exported.name !== local.name) {
            return `${local.name} as ${exported.name}`;
        }

        return local.name;
    });

    return compact(specifiers);
};

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

export { consolidateExports, exportToString, isInlineExport, toNamedExport };
