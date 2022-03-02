import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import {
    ExportableNode,
    ExportAssignment,
    ImportDeclaration,
    ImportSpecifier,
    NameableNode,
    Node,
    SourceFile,
} from "ts-morph";
import { compact } from "lodash";
import { withRetry } from "../utils/with-retry";

type NameableExportableNode = NameableNode & ExportableNode;

const _namedExportsOnly: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const defaultExportSymbol = file.getDefaultExportSymbol();
    if (defaultExportSymbol == null) {
        Logger.ruleDebug({
            file,
            rule: RuleName.NamedExportsOnly,
            message: "No default export found.",
        });
        return { errors: [], diff: [], file };
    }

    const inlineExportErrors = convertInlineExports(file);
    const defaultExportErrors = convertDefaultExport(file);

    const endingFileContent = file.getText();

    return {
        errors: [...defaultExportErrors, ...inlineExportErrors],
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

_namedExportsOnly.__name = RuleName.NamedExportsOnly;

const convertDefaultExport = (file: SourceFile): RuleViolation[] => {
    const defaultExport = file
        .getExportAssignments()
        .find((_export) => !_export.isExportEquals());

    if (defaultExport == null) {
        return [];
    }

    const defaultExportName = getDefaultExportIdentifier(defaultExport);
    const errors = [getRuleViolation(file, defaultExport)];

    replaceDefaultImports(file, defaultExportName);

    defaultExport?.remove();
    file.addExportDeclaration({ namedExports: [defaultExportName] });

    return errors;
};

const convertInlineExports = (file: SourceFile): RuleViolation[] => {
    const exportableNodes = file
        .getDescendants()
        .filter(
            (node) => Node.isExportable(node) && Node.hasName(node)
        ) as any as NameableExportableNode[];

    const defaultExport = exportableNodes.find((node) =>
        node.hasDefaultKeyword()
    );

    if (defaultExport == null) {
        return [];
    }

    replaceDefaultImports(file, getDefaultExportIdentifier(defaultExport));

    defaultExport.setIsExported(true);
    return [getRuleViolation(file, defaultExport)];
};

const getDefaultExportIdentifier = (
    _export: ExportAssignment | NameableExportableNode
): string => {
    if (_export instanceof ExportAssignment) {
        return _export
            .getText()
            .replace("export default", "")
            .replace(";", "")
            .trim();
    }

    return _export.getName() ?? "";
};

const getDefaultImportDeclarationsForFile = (
    sourceFile: SourceFile,
    referencingFiles: SourceFile[]
): ImportDeclaration[] => {
    const defaultImports = referencingFiles.map((referencingFile) =>
        referencingFile
            .getImportDeclarations()
            .find(
                (importDeclaration) =>
                    importDeclaration.getDefaultImport() != null &&
                    importDeclaration.getModuleSpecifierSourceFile() ===
                        sourceFile
            )
    );

    return compact(defaultImports);
};

const getRuleViolation = (
    file: SourceFile,
    _export: ExportAssignment | NameableExportableNode
) => {
    const name = getDefaultExportIdentifier(_export);

    const lineNumber = (_export as any as Node).getStartLineNumber();

    return new RuleViolation({
        file,
        message: `Found default export '${name}'`,
        lineNumber,
        hint: `'${name}' should be a named export instead`,
        rule: RuleName.NamedExportsOnly,
    });
};

const replaceDefaultImports = (file: SourceFile, importName: string) => {
    const referencingSourceFiles = file.getReferencingSourceFiles();
    const defaultImports = getDefaultImportDeclarationsForFile(
        file,
        referencingSourceFiles
    );

    defaultImports.forEach((importDeclaration) =>
        replaceDefaultImport(importName, importDeclaration)
    );
};

const replaceDefaultImport = (
    importName: string,
    importDeclaration: ImportDeclaration
) => {
    const existingNamedImports = importDeclaration
        .getNamedImports()
        .map((importSpecifier: ImportSpecifier) =>
            importSpecifier.getStructure()
        );

    importDeclaration.set({
        defaultImport: undefined,
        namedImports: [importName, ...existingNamedImports],
    });
};

const namedExportsOnly = withRetry(_namedExportsOnly);

export { namedExportsOnly };
