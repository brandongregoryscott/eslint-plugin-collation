import { diffLines } from "diff";
import {
    chain,
    compact,
    first,
    flatMap,
    isEmpty,
    isEqual,
    last,
    sortBy,
} from "lodash";
import {
    CallExpression,
    Identifier,
    Node,
    PropertyAccessExpression,
    SourceFile,
    SyntaxKind,
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

    const identifiers = chain(arrayLiteral.getDescendants())
        .filter(
            (node) =>
                Node.isIdentifier(node) || Node.isPropertyAccessExpression(node)
        )
        .thru((nodes) => nodes as Array<Identifier | PropertyAccessExpression>)
        // Filter out identifier pieces of PropertyAccessExpressions such as project.name
        // which are pulled separately to propertly reconstruct strings + dedupe
        .filter(isNotChildOfPropertyAccess)
        .value();

    if (isEmpty(identifiers)) {
        return [];
    }

    const originalIdentifierStrings = identifiers.map(getIdentifierText);
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
            ...getAlphabeticalMessages({
                index,
                expectedIndex,
                sorted: sortedIdentifierStrings,
                original: originalIdentifierStrings,
                parentName: getFunctionCallName(functionCall),
                elementTypeName: "dependency",
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

const getIdentifierText = (identifier: Identifier | PropertyAccessExpression) =>
    identifier.getText();

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

const isNotChildOfPropertyAccess = (
    identifierOrPropertyAccess: Identifier | PropertyAccessExpression
): boolean =>
    identifierOrPropertyAccess.getParentIfKind(
        SyntaxKind.PropertyAccessExpression
    ) == null;

export { alphabetizeDependencyLists };
