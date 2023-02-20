import type { TSESTree } from "@typescript-eslint/utils";
import isEmpty from "lodash/isEmpty";
import last from "lodash/last";
import type { NamedExport } from "../types/named-export";

/**
 * Converts multiple named exports into a single export. This function
 * assumes the exports are all the same kind, for the same module and the array contains at least two entries
 */
const consolidateExports = (exports: NamedExport[]): NamedExport => {
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

const getSpecifiers = (_export: TSESTree.ExportNamedDeclaration): string[] =>
    _export.specifiers.map((specifier) => {
        const { exported, local } = specifier;
        if (exported.name !== local.name) {
            return `${local.name} as ${exported.name}`;
        }
        return local.name;
    });

const toNamedExport = (
    _export: TSESTree.ExportNamedDeclaration
): NamedExport => ({
    kind: _export.exportKind,
    module: _export.source?.value,
    reference: _export,
    specifiers: getSpecifiers(_export),
});

const exportToString = (_export: NamedExport): string => {
    const { kind, module } = _export;

    const exportKeyword = kind === "type" ? "export type" : "export";
    const specifierList = _export.specifiers.join(", ");

    const moduleSpecifier = isEmpty(module) ? "" : ` from "${module}"`;

    return `${exportKeyword} { ${specifierList} }${moduleSpecifier};`;
};

export { consolidateExports, toNamedExport, exportToString };
