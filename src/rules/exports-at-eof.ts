import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import { ExportDeclaration, ExportSpecifier, Node, SourceFile } from "ts-morph";
import { castArray, flatMap, intersection, isEmpty, uniq } from "lodash";
import { withRetry } from "../utils/with-retry";

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

const moveExportsToEof = (file: SourceFile): RuleViolation[] => {
    const errors: RuleViolation[] = [];
    const exports: string[] = [];
    const exportMap = file.getExportedDeclarations();

    exportMap.forEach((exportedDeclarations) => {
        exportedDeclarations.forEach((exportedDeclaration) => {
            if (
                !Node.isExportable(exportedDeclaration) &&
                !Node.isVariableDeclaration(exportedDeclaration)
            ) {
                return;
            }

            const exportedNode = Node.isVariableDeclaration(exportedDeclaration)
                ? exportedDeclaration.getVariableStatement()
                : exportedDeclaration;

            if (exportedNode == null) {
                Logger.warn(
                    `Found VariableDeclaration without a VariableStatement to remove the export keyword from.`,
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

            exportedNode.setIsExported(false);
            exports.push(name!);
            errors.push(
                new RuleViolation({
                    message: `Expected exported node '${name}' to appear at the end of the file.`,
                    lineNumber: exportedNode.getStartLineNumber(),
                    file,
                    rule: RuleName.ExportsAtEof,
                })
            );
        });
    });

    const exportDeclarations = file.getExportDeclarations();

    // Attempt to attach the exports to an existing declaration, even if only partially matching
    const exportDeclaration = exportDeclarations.find(
        (exportDeclaration) =>
            !isEmpty(intersection(getNamedExports(exportDeclaration), exports))
    );

    if (exportDeclaration == null) {
        file.addExportDeclaration({
            namedExports: uniq(exports),
        });

        return errors;
    }

    const existingExports = getNamedExports(exportDeclaration);
    exportDeclaration.set({
        namedExports: uniq([...existingExports, ...exports]),
    });

    return errors;
};

const exportsAtEof = withRetry(_exportsAtEof);

export { exportsAtEof };
