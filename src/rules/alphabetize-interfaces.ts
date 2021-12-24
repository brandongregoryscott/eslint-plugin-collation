import { diffLines } from "diff";
import _, { isEqual, sortBy, flatten, compact } from "lodash";
import { InterfaceDeclaration, PropertySignature, SourceFile } from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
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
    const sorted = sortBy(properties, getPropertyName);

    if (isEqual(properties, sorted)) {
        const lineNumber = _interface.getStartLineNumber();
        Logger.ruleDebug({
            file: _interface.getSourceFile(),
            lineNumber,
            message: `Properties of interface ${_interface.getName()} are already sorted.`,
            rule: RuleName.AlphabetizeInterfaces,
        });

        return [];
    }

    const errors = properties.map((property) => {
        const currentIndex = properties.indexOf(property);
        const expectedIndex = sorted.indexOf(property);
        if (currentIndex === expectedIndex) {
            return;
        }

        property.setOrder(sorted.indexOf(property));

        return new RuleViolation({
            ...getAlphabeticalMessages({
                index: currentIndex,
                expectedIndex,
                elementTypeName: "property",
                sorted,
                original: properties,
                parentName: _interface.getName(),
                getElementName: getPropertyName,
                getElementStructureName: getPropertyName,
            }),
            file: _interface.getSourceFile(),
            lineNumber: property.getStartLineNumber(),
            rule: RuleName.AlphabetizeInterfaces,
        });
    });

    return compact(errors);
};

const getPropertyName = (property: PropertySignature) => property.getName();

export { alphabetizeInterfaces };
