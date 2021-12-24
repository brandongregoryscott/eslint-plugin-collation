import { diffLines } from "diff";
import _, { isEqual, sortBy, flatten, compact } from "lodash";
import { InterfaceDeclaration, PropertySignature, SourceFile } from "ts-morph";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";

const alphabetizeInterfaces: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();
    const interfaces = file.getInterfaces();
    const errors = flatten(interfaces.map(alphabetizeInterface));
    const endingFileContent = file.getText();

    return {
        file,
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
    };
};

const alphabetizeInterface = (
    _interface: InterfaceDeclaration
): RuleViolation[] => {
    const properties = _interface.getProperties();
    const sorted = sortBy(properties, (e) => e.getName());

    if (isEqual(properties, sorted)) {
        const fileName = _interface.getSourceFile().getBaseName();
        const lineNumber = _interface.getStartLineNumber();
        Logger.debug(
            `Properties of interface ${_interface.getName()} on line ${lineNumber} of ${fileName} are already sorted.`
        );

        return [];
    }

    const errors = properties.map((property) => {
        const currentIndex = properties.indexOf(property);
        const expectedIndex = sorted.indexOf(property);
        if (currentIndex === expectedIndex) {
            return;
        }

        property.setOrder(sorted.indexOf(property));

        return getRuleViolation(_interface, property, properties, sorted);
    });

    return compact(errors);
};

const getRuleViolation = (
    _interface: InterfaceDeclaration,
    property: PropertySignature,
    properties: PropertySignature[],
    sorted: PropertySignature[]
): RuleViolation => {
    const propertyName = property.getName();
    const interfaceName = _interface.getName();
    const originalIndex = properties.indexOf(property);
    const expectedIndex = sorted.indexOf(property);
    const propertyMovedToLastPosition = expectedIndex + 1 === properties.length;
    const relativePropertyName =
        sorted[
            propertyMovedToLastPosition ? expectedIndex - 1 : expectedIndex + 1
        ]?.getName();
    const relativePosition = propertyMovedToLastPosition ? "after" : "before";
    const hint = `'${propertyName}' should appear alphabetically ${relativePosition} '${relativePropertyName}'.`;

    return new RuleViolation({
        file: _interface.getSourceFile(),
        hint,
        lineNumber: property.getStartLineNumber(),
        message: `Expected property '${propertyName}' in '${interfaceName}' (index ${originalIndex}) to be at index ${expectedIndex}.`,
        rule: "alphabetize-interfaces",
    });
};

export { alphabetizeInterfaces };
