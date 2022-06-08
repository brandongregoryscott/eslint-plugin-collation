import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
    RuleContext,
    RuleFix,
    RuleFixer,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { createRule } from "../utils/rule-utils";

const callExpressionNames = ["useCallback", "useEffect", "useMemo"];

const sortDependencyList = createRule({
    create: (context) => {
        const callExpressions: TSESTree.CallExpression[] = [];

        return {
            ArrayExpression: (arrayExpression) =>
                handleVisitArrayExpression(
                    arrayExpression,
                    callExpressions,
                    context
                ),
            CallExpression: (callExpression) =>
                handleVisitCallExpression(callExpression, callExpressions),
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Sorts React dependency lists",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            sortDependencyList: "Expected dependency list to be sorted",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.SortDependencyList,
});

/**
 * Returns the underlying function call name from a given `CallExpression`
 */
const getCallExpressionName = (
    callExpression: TSESTree.CallExpression
): string | undefined => {
    const { parent } = callExpression;
    if (parent == null || parent.type !== AST_NODE_TYPES.ExpressionStatement) {
        return undefined;
    }

    const { expression } = parent;
    if (
        expression.type !== AST_NODE_TYPES.CallExpression ||
        expression.callee.type !== AST_NODE_TYPES.Identifier
    ) {
        return undefined;
    }

    return expression.callee.name;
};

/**
 * Returns the underlying name from the `Identifier` or `MemberExpression` node
 */
const getIdentifierName = (
    identifier: TSESTree.MemberExpression | TSESTree.Identifier
): string =>
    identifier.type === AST_NODE_TYPES.Identifier
        ? identifier.name
        : getMemberExpressionName(identifier);

/**
 * Returns the fully qualified `MemberExpression` name, i.e. `theme.colors.gray900`
 */
const getMemberExpressionName = (member: TSESTree.MemberExpression): string => {
    const { object, property } = member;
    if (property.type !== AST_NODE_TYPES.Identifier) {
        return "";
    }

    if (object.type === AST_NODE_TYPES.MemberExpression) {
        return `${getMemberExpressionName(object)}.${property.name}`;
    }

    if (object.type !== AST_NODE_TYPES.Identifier) {
        return "";
    }

    return `${object.name}.${property.name}`;
};

const handleVisitArrayExpression = (
    arrayExpression: TSESTree.ArrayExpression,
    callExpressions: TSESTree.CallExpression[],
    context: RuleContext<"sortDependencyList", never[]>
): void => {
    if (arrayExpression.parent?.type !== AST_NODE_TYPES.CallExpression) {
        return;
    }

    const isDependencyList = callExpressions.includes(arrayExpression.parent);

    if (!isDependencyList) {
        return;
    }

    if (!hasOnlyIdentifiers(arrayExpression)) {
        return;
    }

    const identifiers = arrayExpression.elements as Array<
        TSESTree.Identifier | TSESTree.MemberExpression
    >;

    if (isSorted(identifiers)) {
        return;
    }

    context.report({
        node: arrayExpression,
        messageId: "sortDependencyList",
        fix: (fixer) => fixUnsortedDependencyList(fixer, arrayExpression),
    });
};

/**
 * Converts the given `ArrayExpression` to its string representation, assuming it only contains
 * `Identifier` and `MemberExpression` elements
 */
const arrayExpressionToString = (
    arrayExpression: TSESTree.ArrayExpression
): string => {
    const commaSeparatedValues = arrayExpression.elements.map((element) =>
        getIdentifierName(
            element as TSESTree.Identifier | TSESTree.MemberExpression
        )
    );

    return `[${commaSeparatedValues.sort().join(", ")}]`;
};

const fixUnsortedDependencyList = (
    fixer: RuleFixer,
    arrayExpression: TSESTree.ArrayExpression
): RuleFix =>
    fixer.replaceText(
        arrayExpression,
        arrayExpressionToString(arrayExpression)
    );

const handleVisitCallExpression = (
    callExpression: TSESTree.CallExpression,
    callExpressions: TSESTree.CallExpression[]
): void => {
    if (!isCallExpressionWithDependencyList(callExpression)) {
        return;
    }

    callExpressions.push(callExpression);
};

/**
 * Returns true if the given `CallExpression` has a dependency list (`ArrayExpression` in the second
 * argument)
 */
const hasDependencyList = (
    callExpression: TSESTree.CallExpression
): boolean => {
    const _arguments = callExpression.arguments;
    const hasExpectedNumberOfArguments = _arguments.length === 2;
    const lastArgumentIsArrayLiteral =
        _arguments[1]?.type === AST_NODE_TYPES.ArrayExpression;

    return hasExpectedNumberOfArguments && lastArgumentIsArrayLiteral;
};

/**
 * Returns true if the `ArrayExpression` contains only identifiers or member access expressions
 * which contain identifiers
 */
const hasOnlyIdentifiers = (
    arrayExpression: TSESTree.ArrayExpression
): boolean =>
    arrayExpression.elements.every(
        (element) =>
            element.type === AST_NODE_TYPES.Identifier ||
            element.type === AST_NODE_TYPES.MemberExpression
    );

/**
 * Returns true if the given `CallExpression` is an expected function with a dependency list
 */
const isCallExpressionWithDependencyList = (
    callExpression: TSESTree.CallExpression
): boolean =>
    callExpressionNames.some((functionName) =>
        callExpressionMatchesName(functionName, callExpression)
    ) && hasDependencyList(callExpression);

/**
 * Returns true if the `CallExpression` matches the given name
 */
const callExpressionMatchesName = (
    name: string,
    callExpression: TSESTree.CallExpression
): boolean => getCallExpressionName(callExpression) === name;

/**
 * Returns true if the given collection of `Identifier` and `MemberExpression` nodes are sorted
 * by their underlying names
 */
const isSorted = (
    identifiers: Array<TSESTree.Identifier | TSESTree.MemberExpression>
): boolean => {
    const current = identifiers.map(getIdentifierName);
    const expected = [...current].sort();
    return JSON.stringify(current) === JSON.stringify(expected);
};

export { sortDependencyList };
