import { diffLines } from "diff";
import {
    compact,
    first,
    flatMap,
    flatten,
    isEmpty,
    isEqual,
    last,
    sortBy,
} from "lodash";
import {
    ArrayLiteralExpression,
    CallExpression,
    Identifier,
    SourceFile,
    SyntaxKind,
    Type,
} from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { getAlphabeticalMessages } from "../utils/get-alphabetical-messages";
import { Logger } from "../utils/logger";

const functionsWithDependencies = ["useCallback", "useEffect", "useMemo"];

const alphabetizeDependencyLists: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();

    const functionCalls = file
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(isFunctionWithDependencies);

    const errors = flatMap(functionCalls, alphabetizeFunctionCallDependencies);
    const endingFileContent = file.getText();
    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizeFunctionCallDependencies = (
    functionCall: CallExpression
): RuleViolation[] => {
    const arrayLiteral = first(
        functionCall.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression)
    );
    // This shouldn't ever happen, but this will prevent null coalescing all over the place
    if (arrayLiteral == null) {
        Logger.debug(
            `ArrayLiteralExpression in ${RuleName.AlphabetizeDependencyLists} was unexpectedly null.`,
            functionCall
        );
        return [];
    }

    const identifiers = arrayLiteral.getDescendantsOfKind(
        SyntaxKind.Identifier
    );
    if (isEmpty(identifiers)) {
        return [];
    }

    const sorted = sortBy(identifiers, getIdentifierText);
    const sortedIdentifierStrings = sorted.map(getIdentifierText);
    if (isEqual(identifiers, sorted)) {
        const lineNumber = functionCall.getStartLineNumber();
        const functionName = getFunctionCallName(functionCall);
        Logger.ruleDebug({
            file: functionCall.getSourceFile(),
            lineNumber,
            message: `Dependency list for ${functionName} already sorted.`,
            rule: RuleName.AlphabetizeDependencyLists,
        });
        return [];
    }

    const errors = identifiers.map((identifier, index) => {
        const expectedIndex = sorted.indexOf(identifier);
        const outOfOrder = expectedIndex !== index;
        const error = new RuleViolation({
            ...getAlphabeticalMessages<Identifier, string>({
                index,
                expectedIndex,
                sorted: sortedIdentifierStrings,
                original: identifiers,
                parentName: getFunctionCallName(functionCall),
                elementTypeName: "dependency",
                getElementName: getIdentifierText,
                getElementStructureName: (identifier) => identifier,
            }),
            file: arrayLiteral.getSourceFile(),
            lineNumber: arrayLiteral.getStartLineNumber(),
            rule: RuleName.AlphabetizeDependencyLists,
        });
        arrayLiteral.removeElement(identifier);

        return outOfOrder ? error : null;
    });

    arrayLiteral.addElements(sortedIdentifierStrings);

    return compact(errors);
};

const getIdentifierText = (identifier: Identifier) => identifier.getText();

const getFunctionCallName = (functionCall: CallExpression): string => {
    const identifiers = functionCall.getChildrenOfKind(SyntaxKind.Identifier);
    return first(identifiers)?.getText() ?? "";
};

const hasDependencyList = (functionCall: CallExpression): boolean => {
    const _arguments = functionCall.getArguments();
    const hasExpectedNumberOfArgs = _arguments.length === 2;
    const lastArgIsArrayLiteral =
        last(_arguments)?.asKind(SyntaxKind.ArrayLiteralExpression) != null;

    return hasExpectedNumberOfArgs && lastArgIsArrayLiteral;
};

const isExpectedIdentifier = (
    expectedIdentifier: string,
    functionCall: CallExpression
): boolean => getFunctionCallName(functionCall) === expectedIdentifier;

const isFunctionWithDependencies = (functionCall: CallExpression): boolean =>
    functionsWithDependencies.some((functionName) =>
        isExpectedIdentifier(functionName, functionCall)
    ) && hasDependencyList(functionCall);

export { alphabetizeDependencyLists };
