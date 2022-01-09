import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import { ExportableNode, ExportAssignment, Node, SourceFile } from "ts-morph";

const namedExportsOnly: RuleFunction = async (
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

    const defaultExport = file
        .getExportAssignments()
        .find((_export) => !_export.isExportEquals());

    if (defaultExport == null) {
        throw new Error(
            "Found default export symbol but no default export assignment"
        );
    }

    const defaultExportName = getDefaultExportIdentifier(defaultExport);
    defaultExport?.remove();

    file.addExportDeclaration({ namedExports: [defaultExportName] });

    const errors = [
        new RuleViolation({
            file,
            message: `Found default export '${defaultExportName}'`,
            lineNumber: 0,
            hint: `'${defaultExportName}' should be a named export instead`,
            rule: RuleName.NamedExportsOnly,
        }),
    ];
    const endingFileContent = file.getText();

    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const getDefaultExportIdentifier = (_export: ExportAssignment): string =>
    _export.getText().replace("export default", "").replace(";", "").trim();

export { namedExportsOnly };
