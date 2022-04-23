import { castArray, flatMap } from "lodash";
import { ExportDeclaration, ExportSpecifier } from "ts-morph";

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

export { getExportNames };
