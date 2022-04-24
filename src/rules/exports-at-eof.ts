import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { SourceFile } from "ts-morph";
import { compact, difference, isEmpty } from "lodash";
import { withRetry } from "../utils/with-retry";
import {
    asExportedNode,
    getExportedDeclarations,
} from "../utils/exported-declarations-utils";
import {
    mergeExportDeclarationsByFile,
    moveExportsToEofByFile,
} from "../utils/export-declaration-utils";
import {
    getExportedNodeName,
    toNamedExportStructure,
} from "../utils/exported-node-utils";
import { NamedExportStructure } from "../types/named-export-structure";
import { replaceDefaultImports } from "../utils/import-utils";

const _exportsAtEof: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const errors = removeInlineExports(file);
    mergeExportDeclarationsByFile(file);
    moveExportsToEofByFile(file);

    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

_exportsAtEof._name = RuleName.ExportsAtEof;

const getExportStructureName = (exportStructure: NamedExportStructure) =>
    exportStructure.name;

const removeInlineExports = (file: SourceFile): RuleViolation[] => {
    const exportedDeclarations = getExportedDeclarations(file);
    const inlineExportedNodes = compact(
        exportedDeclarations.map(asExportedNode)
    );

    if (isEmpty(inlineExportedNodes)) {
        return [];
    }

    const exportStructures = compact(
        inlineExportedNodes.map(toNamedExportStructure)
    );

    inlineExportedNodes.forEach((exportedNode) => {
        const name = getExportedNodeName(exportedNode);
        if (exportedNode.isDefaultExport() && name != null) {
            replaceDefaultImports(file, name);
        }

        exportedNode.setIsExported(false);
    });

    const { isolatedModules = false } = file.getProject().getCompilerOptions();

    const typeExportStructures = exportStructures.filter(
        (exportStructure) => exportStructure.isType
    );

    if (isolatedModules && !isEmpty(typeExportStructures)) {
        const nonTypeExportStructures = difference(
            exportStructures,
            typeExportStructures
        );

        file.addExportDeclaration({
            namedExports: typeExportStructures.map(getExportStructureName),
            isTypeOnly: true,
        });

        if (!isEmpty(nonTypeExportStructures)) {
            file.addExportDeclaration({
                namedExports: nonTypeExportStructures.map(
                    getExportStructureName
                ),
                isTypeOnly: false,
            });
        }
        return [];
    }

    file.addExportDeclaration({
        namedExports: exportStructures.map(getExportStructureName),
    });

    return [];
};

const exportsAtEof = withRetry(_exportsAtEof);

export { exportsAtEof };
