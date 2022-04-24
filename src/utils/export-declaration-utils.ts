import {
    castArray,
    compact,
    difference,
    first,
    flatMap,
    flatten,
    intersection,
    intersectionBy,
    isEmpty,
    takeRight,
    uniq,
    uniqBy,
    uniqWith,
} from "lodash";
import {
    ExportDeclaration,
    ExportDeclarationStructure,
    ExportSpecifier,
    ExportSpecifierStructure,
    Node,
    OptionalKind,
    SourceFile,
} from "ts-morph";
import { countBy, filterNot } from "./collection-utils";

const dedupeExportDeclarationStructuresByName = (
    structures: ExportDeclarationStructure[]
): ExportDeclarationStructure[] => {
    const typeExportSpecifiers = flatten(
        structures
            .filter(isTypeExportDeclaration)
            .map(getExportSpecifierStructures)
    );
    const nonTypeExportSpecifiers = flatten(
        filterNot(structures, isTypeExportDeclaration).map(
            getExportSpecifierStructures
        )
    );

    const duplicateExportSpecifiers = getDuplicateExportSpecifiers(
        typeExportSpecifiers,
        nonTypeExportSpecifiers
    );

    if (isEmpty(duplicateExportSpecifiers)) {
        return structures;
    }

    return compact(
        structures.map((structure) =>
            removeDuplicateExportSpecifiers(
                structure,
                duplicateExportSpecifiers
            )
        )
    );
};

const getDuplicateExportSpecifiers = (
    left:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>,
    right:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>
): Array<OptionalKind<ExportSpecifierStructure>> =>
    intersectionBy(
        castArray(left),
        castArray(right),
        (exportSpecifier) => exportSpecifier.name
    );

const getEofExportDeclarations = (file: SourceFile): ExportDeclaration[] =>
    takeRight(file.getStatements(), 2).filter(Node.isExportDeclaration);

const getExportDeclarations = (file: SourceFile): ExportDeclaration[] =>
    file.getStatements().filter(Node.isExportDeclaration);

const getExportNames = (
    exportDeclarations: ExportDeclaration[] | ExportDeclaration
): string[] =>
    uniq(
        flatMap(castArray(exportDeclarations), (exportDeclaration) =>
            exportDeclaration
                .getNamedExports()
                .map((exportSpecifier: ExportSpecifier) =>
                    exportSpecifier.getName()
                )
        )
    );

const getExportSpecifierStructures = (
    structure: ExportDeclarationStructure
): Array<OptionalKind<ExportSpecifierStructure>> =>
    (structure.namedExports ?? []) as Array<
        OptionalKind<ExportSpecifierStructure>
    >;

const getInlineExportDeclarations = (file: SourceFile): ExportDeclaration[] =>
    difference(getExportDeclarations(file), getEofExportDeclarations(file));

const hasDuplicateExportSpecifiers = (
    left:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>,
    right:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>
): boolean => !isEmpty(getDuplicateExportSpecifiers(left, right));

const isDuplicateExportSpecifier = (
    exportSpecifier: OptionalKind<ExportSpecifierStructure>,
    exportSpecifiers: Array<OptionalKind<ExportSpecifierStructure>>
) => hasDuplicateExportSpecifiers(exportSpecifier, exportSpecifiers);

const isEofExportDeclaration = (
    exportDeclaration: ExportDeclaration
): boolean =>
    getEofExportDeclarations(exportDeclaration.getSourceFile()).includes(
        exportDeclaration
    );

const isTypeExportDeclaration = (
    exportDeclaration: ExportDeclaration | ExportDeclarationStructure
): boolean =>
    exportDeclaration instanceof ExportDeclaration
        ? exportDeclaration.isTypeOnly()
        : exportDeclaration.isTypeOnly === true;

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
const moveExportsToEof = (exportDeclarations: ExportDeclaration[]): void => {
    const file = first(exportDeclarations)?.getSourceFile();
    if (file == null) {
        return;
    }

    const structures = dedupeExportDeclarationStructuresByName(
        exportDeclarations.map((exportDeclaration) =>
            exportDeclaration.getStructure()
        )
    );

    const typeExportStructures = structures.filter(isTypeExportDeclaration);
    const nonTypeExportStructures = difference(
        structures,
        typeExportStructures
    );

    removeExportDeclarations(exportDeclarations);

    if (isEmpty(typeExportStructures)) {
        file.addExportDeclarations(structures);
        return;
    }

    // Always add type exports above non-type exports
    file.addExportDeclarations([
        ...typeExportStructures,
        ...nonTypeExportStructures,
    ]);
};

/**
 * Removes and re-adds `ExportDeclaration` statements at the end of a `SourceFile`
 */
const moveExportsToEofByFile = (file: SourceFile): void => {
    const exportDeclarations = getExportDeclarations(file);
    moveExportsToEof(exportDeclarations);
};

/**
 * Removes duplicate `ExportSpecifier`s in the `namedExports` collection. If no specifiers remain,
 * the structure is not returned since it has no use.
 */
const removeDuplicateExportSpecifiers = (
    structure: ExportDeclarationStructure,
    duplicateExportSpecifiers: Array<OptionalKind<ExportSpecifierStructure>>
): ExportDeclarationStructure | undefined => {
    // As a first pass we're more concerned about removing duplicate type exports from non-type export structures
    if (structure.isTypeOnly) {
        return structure;
    }

    const exportSpecifiers = getExportSpecifierStructures(structure);
    const hasDuplicates = hasDuplicateExportSpecifiers(
        exportSpecifiers,
        duplicateExportSpecifiers
    );

    if (!hasDuplicates) {
        return structure;
    }

    structure.namedExports = filterNot(exportSpecifiers, (exportSpecifier) =>
        isDuplicateExportSpecifier(exportSpecifier, duplicateExportSpecifiers)
    );

    if (isEmpty(structure.namedExports)) {
        return;
    }

    return structure;
};

const removeExportDeclarations = (
    exportDeclarations: ExportDeclaration | ExportDeclaration[]
) =>
    castArray(exportDeclarations).forEach((exportDeclaration) =>
        exportDeclaration.remove()
    );

export {
    getInlineExportDeclarations,
    getEofExportDeclarations,
    getExportDeclarations,
    getExportNames,
    isEofExportDeclaration,
    mergeExportDeclarationsByFile,
    moveExportsToEofByFile,
    moveExportsToEof,
};
