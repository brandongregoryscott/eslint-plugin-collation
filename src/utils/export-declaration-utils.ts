import {
    castArray,
    compact,
    difference,
    first,
    flatMap,
    flatten,
    intersectionBy,
    isEmpty,
    last,
    takeRight,
    uniq,
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
import { RuleName } from "../enums/rule-name";
import { RuleViolation } from "../models/rule-violation";
import { filterNot } from "./collection-utils";

interface ExportDeclarationStructureWithLineNumber
    extends ExportDeclarationStructure {
    lineNumber: number;
}

const dedupeExportDeclarationStructuresByName = (
    structures: ExportDeclarationStructureWithLineNumber[]
): ExportDeclarationStructureWithLineNumber[] => {
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

const getEofExportDeclarations = (file: SourceFile): ExportDeclaration[] => {
    const maybeEofExportDeclarations = takeRight(file.getStatements(), 2);

    if (!Node.isExportDeclaration(last(maybeEofExportDeclarations))) {
        return [];
    }

    return maybeEofExportDeclarations.filter(Node.isExportDeclaration);
};

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

const getEofRuleViolation = (
    file: SourceFile,
    structure: ExportDeclarationStructureWithLineNumber
): RuleViolation =>
    new RuleViolation({
        file,
        message: `Expected export of '${getExportSpecifierStructures(
            structure
        ).join(", ")}' to appear at the end of the file.`,
        lineNumber: structure.lineNumber,
        rule: RuleName.ExportsAtEof,
    });

const hasDuplicateExportSpecifiers = (
    left:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>,
    right:
        | OptionalKind<ExportSpecifierStructure>
        | Array<OptionalKind<ExportSpecifierStructure>>
): boolean => !isEmpty(getDuplicateExportSpecifiers(left, right));

const hasNamedExport = (file: SourceFile, exportName: string): boolean =>
    getExportNames(getExportDeclarations(file)).includes(exportName);

const isDuplicateExportSpecifier = (
    exportSpecifier: OptionalKind<ExportSpecifierStructure>,
    exportSpecifiers: Array<OptionalKind<ExportSpecifierStructure>>
) => hasDuplicateExportSpecifiers(exportSpecifier, exportSpecifiers);

const isEofExportDeclaration = (
    exportDeclaration: ExportDeclaration
): boolean => {
    const eofDeclarations = getEofExportDeclarations(
        exportDeclaration.getSourceFile()
    );

    if (
        eofDeclarations.length === 1 &&
        eofDeclarations.includes(exportDeclaration)
    ) {
        return true;
    }

    const isNonTypeEofExport =
        !exportDeclaration.isTypeOnly() &&
        exportDeclaration === last(eofDeclarations);
    const isTypeEofExport =
        exportDeclaration.isTypeOnly() &&
        exportDeclaration === eofDeclarations[1];

    return isNonTypeEofExport || isTypeEofExport;
};

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

    const typeExports = exportDeclarations.filter(isTypeExportDeclaration);
    const nonTypeExports = filterNot(
        exportDeclarations,
        isTypeExportDeclaration
    );

    const { length: typeExportCount } = typeExports;
    const { length: nonTypeExportCount } = nonTypeExports;

    if (typeExportCount <= 1 && nonTypeExportCount <= 1) {
        return;
    }

    if (typeExportCount > 1) {
        mergeExportDeclarations(file, typeExports);
    }

    if (nonTypeExportCount > 1) {
        mergeExportDeclarations(file, nonTypeExports);
    }
};

/**
 * Removes and re-adds `ExportDeclaration` statements at the end of a `SourceFile`
 */
const moveExportsToEof = (
    exportDeclarations: ExportDeclaration[]
): RuleViolation[] => {
    if (exportDeclarations.every(isEofExportDeclaration)) {
        return [];
    }

    const file = first(exportDeclarations)?.getSourceFile();
    if (file == null) {
        return [];
    }

    const structures: ExportDeclarationStructureWithLineNumber[] =
        dedupeExportDeclarationStructuresByName(
            exportDeclarations.map((exportDeclaration) => ({
                ...exportDeclaration.getStructure(),
                lineNumber: exportDeclaration.getStartLineNumber(),
            }))
        );

    const typeExportStructures = structures.filter(isTypeExportDeclaration);
    const nonTypeExportStructures = difference(
        structures,
        typeExportStructures
    );

    removeExportDeclarations(exportDeclarations);

    if (isEmpty(typeExportStructures)) {
        file.addExportDeclarations(structures);
        return structures.map((structure) =>
            getEofRuleViolation(file, structure)
        );
    }

    // Always add type exports above non-type exports
    const sortedStructures = [
        ...typeExportStructures,
        ...nonTypeExportStructures,
    ];
    file.addExportDeclarations(sortedStructures);

    return sortedStructures.map((structure) =>
        getEofRuleViolation(file, structure)
    );
};

/**
 * Removes and re-adds `ExportDeclaration` statements at the end of a `SourceFile`
 */
const moveExportsToEofByFile = (file: SourceFile): RuleViolation[] => {
    const exportDeclarations = getExportDeclarations(file);
    return moveExportsToEof(exportDeclarations);
};

/**
 * Removes duplicate `ExportSpecifier`s in the `namedExports` collection. If no specifiers remain,
 * the structure is not returned since it has no use.
 */
const removeDuplicateExportSpecifiers = (
    structure: ExportDeclarationStructureWithLineNumber,
    duplicateExportSpecifiers: Array<OptionalKind<ExportSpecifierStructure>>
): ExportDeclarationStructureWithLineNumber | undefined => {
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
    hasNamedExport,
    isEofExportDeclaration,
    mergeExportDeclarationsByFile,
    moveExportsToEofByFile,
    moveExportsToEof,
};
