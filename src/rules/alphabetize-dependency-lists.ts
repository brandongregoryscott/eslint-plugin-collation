import { diffLines } from "diff";
import {
    compact,
    first,
    flatten,
    isEmpty,
    isEqual,
    last,
    sortBy,
} from "lodash";
import {
    ArrayLiteralExpression,
    CallExpression,
    SourceFile,
    SyntaxKind,
    Type,
} from "ts-morph";
import { RuleName } from "../enums/rule-name";
import { RuleResult } from "../interfaces/rule-result";
import { RuleViolation } from "../models/rule-violation";
import { RuleFunction } from "../types/rule-function";
import { Logger } from "../utils/logger";

const functionsWithDependencies = ["useCallback", "useEffect", "useMemo"];

const alphabetizeDependencyLists: RuleFunction = async (
    file: SourceFile
): Promise<RuleResult> => {
    const originalFileContent = file.getText();

    const functionCalls = file
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(
            (functionCall) =>
                isUseCallback(functionCall) ||
                isUseEffect(functionCall) ||
                isUseMemo(functionCall)
        );

    const arrayLiterals = flatten(
        functionCalls.map((functionCall) =>
            functionCall.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression)
        )
    );

    const errors = flatten(arrayLiterals.map(alphabetizeArrayLiteral));
    const endingFileContent = file.getText();
    return {
        errors,
        diff: diffLines(originalFileContent, endingFileContent),
        file,
    };
};

const alphabetizeArrayLiteral = (
    arrayLiteral: ArrayLiteralExpression
): RuleViolation[] => {
    const identifiers = arrayLiteral.getDescendantsOfKind(
        SyntaxKind.Identifier
    );
    if (isEmpty(identifiers)) {
        return [];
    }

    const sortedIdentifiers = sortBy(identifiers, (identifier) =>
        identifier.getText()
    );
    const sortedIdentifierStrings = sortedIdentifiers.map((identifier) =>
        identifier.getText()
    );
    if (isEqual(identifiers, sortedIdentifiers)) {
        Logger.debug("Dependency list already sorted.");
        return [];
    }

    const errors = identifiers.map((identifier, index) => {
        const expectedIndex = sortedIdentifiers.indexOf(identifier);
        const outOfOrder = expectedIndex !== index;
        arrayLiteral.removeElement(identifier);
        return outOfOrder
            ? new RuleViolation({
                  file: arrayLiteral.getSourceFile(),
                  message: "",
                  lineNumber: arrayLiteral.getStartLineNumber(),
                  rule: RuleName.AlphabetizeDependencyLists,
              })
            : null;
    });

    arrayLiteral.addElements(sortedIdentifierStrings);

    return compact(errors);
};

const isUseCallback = (functionCall: CallExpression): boolean =>
    isExpectedIdentifier("useCallback", functionCall) &&
    hasDependencyList(functionCall);

const isUseEffect = (functionCall: CallExpression): boolean =>
    isExpectedIdentifier("useEffect", functionCall) &&
    hasDependencyList(functionCall);

const isUseMemo = (functionCall: CallExpression): boolean =>
    isExpectedIdentifier("useMemo", functionCall) &&
    hasDependencyList(functionCall);

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
): boolean => {
    const identifiers = functionCall.getChildrenOfKind(SyntaxKind.Identifier);
    const hasIdentifiers = !isEmpty(identifiers);
    const nameMatches = first(identifiers)?.getText() === "useEffect";

    return hasIdentifiers && nameMatches;
};

export { alphabetizeDependencyLists };
