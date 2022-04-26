import { diffLines } from "diff";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";
import {
    ExportableNode,
    ExportAssignment,
    NameableNode,
    Node,
    SourceFile,
} from "ts-morph";
import { withRetry } from "../utils/with-retry";
import { replaceDefaultImports } from "../utils/import-utils";
import { hasNamedExport } from "../utils/export-declaration-utils";

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

_namedExportsOnly._name = RuleName.NamedExportsOnly;

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

    if (hasNamedExport(file, defaultExportName)) {
        return errors;
    }

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

    const errors = [getRuleViolation(file, defaultExport)];
    const defaultExportName = getDefaultExportIdentifier(defaultExport);
    replaceDefaultImports(file, defaultExportName);

    if (hasNamedExport(file, defaultExportName)) {
        return errors;
    }

    defaultExport.setIsExported(true);
    return errors;
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

const namedExportsOnly = withRetry(_namedExportsOnly);

export { namedExportsOnly };
