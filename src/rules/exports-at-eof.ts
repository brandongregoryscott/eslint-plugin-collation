import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import {
    ExportableNode,
    ExportDeclaration,
    ExportedDeclarations,
    ExportSpecifier,
    NameableNode,
    Node,
    SourceFile,
    VariableDeclaration,
} from "ts-morph";
import {
    castArray,
    compact,
    flatMap,
    isEmpty,
    last,
    takeRight,
    uniq,
} from "lodash";
import { withRetry } from "../utils/with-retry";
import { replaceDefaultImports } from "../utils/import-utils";

interface Export {
    isType: boolean;
    name: string;
}

interface MoveExportDeclarationsToEofResult {
    export: Export;
    error: RuleViolation;
}

const _exportsAtEof: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const errors = moveExportsToEof(file);
    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

_exportsAtEof._name = RuleName.ExportsAtEof;

const getNamedExports = (
    exportDeclarations: ExportDeclaration[] | ExportDeclaration
): string[] =>
    flatMap(castArray(exportDeclarations), (exportDeclaration) =>
        exportDeclaration
            .getNamedExports()
            .map((exportSpecifier: ExportSpecifier) =>
                exportSpecifier.getName()
            )
    );

const getExportedDeclarations = (file: SourceFile): ExportedDeclarations[] => {
    const exportMap = file.getExportedDeclarations();
    const aggregatedExportedDeclarations: ExportedDeclarations[] = [];
    exportMap.forEach((exportedDeclarations) => {
        aggregatedExportedDeclarations.push(...exportedDeclarations);
    });

    return aggregatedExportedDeclarations;
};

const isEndOfFileExport = (
    file: SourceFile,
    exportedNode: ExportableNode | VariableDeclaration
): boolean => {
    if (!Node.hasName(exportedNode as Node)) {
        return false;
    }

    // Take the last 2 statements to allow for named export line + type exports, if they exist
    const lastStatements = takeRight(file.getStatements(), 2).filter(
        Node.isExportDeclaration
    );

    const exportNames = getNamedExports(lastStatements);
    return exportNames.includes(
        (exportedNode as any as NameableNode).getName()!
    );
};

const moveExportsToEof = (file: SourceFile): RuleViolation[] => {
    const results = compact(
        flatMap(getExportedDeclarations(file), moveExportedDeclarationsToEof)
    );

    const errors = results.map((result) => result.error);
    const exports = results.map((result) => result.export);

    if (isEmpty(exports)) {
        if (!isEmpty(errors)) {
            Logger.debug(
                "Exports collection was empty but errors were not",
                exports,
                errors
            );
        }
        return errors;
    }

    const exportDeclarations = file.getExportDeclarations();

    // Attempt to attach the exports to the last declaration, if one exists
    const exportDeclaration = last(exportDeclarations);

    if (exportDeclaration == null) {
        file.addExportDeclaration({
            namedExports: uniq(exports.map((_export) => _export.name)),
        });

        return errors;
    }

    const existingExports = getNamedExports(exportDeclaration);
    exportDeclaration.set({
        namedExports: uniq([
            ...existingExports,
            ...exports.map((_export) => _export.name),
        ]),
        // Take away type keyword if any of the exports are non-type exports - and leave it as-is if not
        isTypeOnly: exports.some((_export) => !_export.isType)
            ? false
            : exportDeclaration.isTypeOnly(),
    });

    return errors;
};

const moveExportedDeclarationsToEof = (
    exportedDeclaration: ExportedDeclarations
): MoveExportDeclarationsToEofResult | undefined => {
    const file = exportedDeclaration.getSourceFile();

    if (
        !Node.isExportable(exportedDeclaration) &&
        !Node.isVariableDeclaration(exportedDeclaration)
    ) {
        return;
    }

    if (isEndOfFileExport(file, exportedDeclaration)) {
        return;
    }

    const exportedNode = Node.isVariableDeclaration(exportedDeclaration)
        ? exportedDeclaration.getVariableStatement()
        : exportedDeclaration;

    if (exportedNode == null) {
        Logger.warn(
            "Found VariableDeclaration without a VariableStatement to remove the export keyword from.",
            exportedDeclaration.getFullText()
        );
        return;
    }

    const name = exportedDeclaration.getName();

    if (isEmpty(name)) {
        Logger.warn(
            "Node returned from getExportedDeclarations() doesn't have a name to export",
            exportedDeclaration
        );
        return;
    }

    if (exportedNode.isDefaultExport()) {
        replaceDefaultImports(file, name!);
    }

    exportedNode.setIsExported(false);

    return {
        export: {
            name: name!,
            isType:
                Node.isInterfaceDeclaration(exportedNode) ||
                Node.isTypeAliasDeclaration(exportedNode),
        },
        error: new RuleViolation({
            message: `Expected exported node '${name}' to appear at the end of the file.`,
            lineNumber: exportedNode.getStartLineNumber(),
            file,
            rule: RuleName.ExportsAtEof,
        }),
    };
};

const exportsAtEof = withRetry(_exportsAtEof);

export { exportsAtEof };
