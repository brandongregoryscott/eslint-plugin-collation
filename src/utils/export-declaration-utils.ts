import { castArray, flatMap } from "lodash";
import { ExportDeclaration, ExportSpecifier, Node, SourceFile } from "ts-morph";
import { countBy, filterNot } from "./collection-utils";

const isTypeExportDeclaration = (exportDeclaration: ExportDeclaration) =>
    exportDeclaration.isTypeOnly();

const getExportDeclarations = (file: SourceFile): ExportDeclaration[] =>
    file.getStatements().filter(Node.isExportDeclaration);

const getExportNames = (
    exportDeclarations: ExportDeclaration[] | ExportDeclaration
): string[] =>
    flatMap(castArray(exportDeclarations), (exportDeclaration) =>
        exportDeclaration
            .getNamedExports()
            .map((exportSpecifier: ExportSpecifier) =>
                exportSpecifier.getName()
            )
    );

const mergeExportDeclarations = (
    file: SourceFile,
    exportDeclarations: ExportDeclaration[]
) => {
    const exportNames = getExportNames(exportDeclarations);
    const isTypeOnly = exportDeclarations.some(isTypeExportDeclaration);
    removeExportDeclarations(exportDeclarations);

    file.addExportDeclaration({
        namedExports: exportNames,
        isTypeOnly,
    });
};

const mergeExportDeclarationsByFile = (file: SourceFile): void => {
    const exportDeclarations = getExportDeclarations(file).filter(
        (exportDeclaration) => exportDeclaration.hasNamedExports()
    );

    const typeExportCount = countBy(
        exportDeclarations,
        isTypeExportDeclaration
    );
    const nonTypeExportCount = exportDeclarations.length - typeExportCount;

    if (typeExportCount <= 1 && nonTypeExportCount <= 1) {
        return;
    }

    if (typeExportCount > 1) {
        const typeExports = exportDeclarations.filter(isTypeExportDeclaration);
        mergeExportDeclarations(file, typeExports);
    }

    if (nonTypeExportCount > 1) {
        const nonTypeExports = filterNot(
            exportDeclarations,
            isTypeExportDeclaration
        );

        mergeExportDeclarations(file, nonTypeExports);
    }
};

/**
 * Removes and re-adds `ExportDeclaration` statements at the end of a `SourceFile`
 */
const moveExportsToEof = (file: SourceFile): void => {
    const exportDeclarations = getExportDeclarations(file);

    const structures = exportDeclarations.map((exportDeclaration) =>
        exportDeclaration.getStructure()
    );

    removeExportDeclarations(exportDeclarations);

    file.addExportDeclarations(structures);
};

const removeExportDeclarations = (
    exportDeclarations: ExportDeclaration | ExportDeclaration[]
) =>
    castArray(exportDeclarations).forEach((exportDeclaration) =>
        exportDeclaration.remove()
    );

export {
    getExportDeclarations,
    getExportNames,
    mergeExportDeclarationsByFile,
    moveExportsToEof,
};
