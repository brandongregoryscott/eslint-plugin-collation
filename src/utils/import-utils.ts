import { compact } from "lodash";
import { ImportDeclaration, ImportSpecifier, SourceFile } from "ts-morph";

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

export { replaceDefaultImports };
