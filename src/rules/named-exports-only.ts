import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { NamedRuleFunction, RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import {
    ExportableNode,
    ExportAssignment,
    NameableNode,
    Node,
    SourceFile,
} from "ts-morph";
import _ from "lodash";
import { withRetry } from "../utils/with-retry";

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

(_namedExportsOnly as NamedRuleFunction).__name = RuleName.NamedExportsOnly;

const convertDefaultExport = (file: SourceFile): RuleViolation[] => {
    const defaultExport = file
        .getExportAssignments()
        .find((_export) => !_export.isExportEquals());

    if (defaultExport == null) {
        return [];
    }

    const defaultExportName = getDefaultExportIdentifier(defaultExport);
    const errors = [getRuleViolation(file, defaultExport)];

    defaultExport?.remove();
    file.addExportDeclaration({ namedExports: [defaultExportName] });

    return errors;
};

const convertInlineExports = (file: SourceFile): RuleViolation[] => {
    const exportableNodes = file
        .getDescendants()
        .filter((node) => Node.isExportable(node)) as any as ExportableNode[];

    const defaultExport = exportableNodes.find((node) =>
        node.hasDefaultKeyword()
    );

    if (defaultExport == null) {
        return [];
    }

    defaultExport.setIsExported(true);
    return [getRuleViolation(file, defaultExport)];
};

const getDefaultExportIdentifier = (_export: ExportAssignment): string =>
    _export.getText().replace("export default", "").replace(";", "").trim();

const getRuleViolation = (
    file: SourceFile,
    _export: ExportAssignment | ExportableNode
) => {
    const name =
        _export instanceof ExportAssignment
            ? getDefaultExportIdentifier(_export)
            : (_export as any as NameableNode).getName();

    const lineNumber = (_export as any as Node).getStartLineNumber();

    return new RuleViolation({
        file,
        message: `Found default export '${name}'`,
        lineNumber,
        hint: `'${name}' should be a named export instead`,
        rule: RuleName.NamedExportsOnly,
    });
};

const namedExportsOnly = withRetry(_namedExportsOnly);

export { namedExportsOnly };
