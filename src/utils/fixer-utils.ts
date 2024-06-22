import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleFix, SourceCode } from "@typescript-eslint/utils/ts-eslint";
import { isCommaToken, isIdentifierToken } from "./node-utils";

// #region Vendorized Fixer functions

/**
 * Creates a fix command that inserts text at the specified index in the source text.
 * @param {int} index The 0-based index at which to insert the new text.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 * @private
 */
const insertTextAt = (index: number, text: string): RuleFix => ({
    range: [index, index],
    text,
});

/**
 * Creates a fix command that inserts text after the given node or token.
 * The fix is not applied until applyFixes() is called.
 * @param {ASTNode|Token} nodeOrToken The node or token to insert after.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const insertTextAfter = (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
) => insertTextAfterRange(nodeOrToken.range, text);

/**
 * Creates a fix command that inserts text after the specified range in the source text.
 * The fix is not applied until applyFixes() is called.
 * @param {int[]} range The range to replace, first item is start of range, second
 *      is end of range.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const insertTextAfterRange = (range: TSESTree.Range, text: string) =>
    insertTextAt(range[1], text);

/**
 * Creates a fix command that inserts text before the given node or token.
 * The fix is not applied until applyFixes() is called.
 * @param {ASTNode|Token} nodeOrToken The node or token to insert before.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const insertTextBefore = (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
) => insertTextBeforeRange(nodeOrToken.range, text);

/**
 * Creates a fix command that inserts text before the specified range in the source text.
 * The fix is not applied until applyFixes() is called.
 * @param {int[]} range The range to replace, first item is start of range, second
 *      is end of range.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const insertTextBeforeRange = (range: TSESTree.Range, text: string): RuleFix =>
    insertTextAt(range[0], text);

/**
 * Creates a fix command that replaces text at the node or token.
 * The fix is not applied until applyFixes() is called.
 * @param {ASTNode|Token} nodeOrToken The node or token to remove.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const replaceText = (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
): RuleFix => replaceTextRange(nodeOrToken.range, text);

/**
 * Creates a fix command that replaces text at the specified range in the source text.
 * The fix is not applied until applyFixes() is called.
 * @param {int[]} range The range to replace, first item is start of range, second
 *      is end of range.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 */
const replaceTextRange = (range: TSESTree.Range, text: string): RuleFix => ({
    range,
    text,
});

/**
 * Creates a fix command that removes the node or token from the source.
 * The fix is not applied until applyFixes() is called.
 * @param {ASTNode|Token} nodeOrToken The node or token to remove.
 * @returns {Object} The fix command.
 */
const remove = (nodeOrToken: TSESTree.Node | TSESTree.Token): RuleFix =>
    removeRange(nodeOrToken.range);

/**
 * Creates a fix command that removes the specified range of text from the source.
 * The fix is not applied until applyFixes() is called.
 * @param {int[]} range The range to remove, first item is start of range, second
 *      is end of range.
 * @returns {Object} The fix command.
 */
const removeRange = (range: TSESTree.Range): RuleFix => ({
    range,
    text: "",
});

// #endregion Vendorized Fixer functions

/**
 * Removes the range of characters between `left` and `right`
 */
const removeBetween = (
    left: TSESTree.Node | TSESTree.Token,
    right: TSESTree.Node | TSESTree.Token
): RuleFix => removeRange([left.range[1], right.range[0]]);

/**
 * Removes the node and the new line character, if one exists between the node and the next token
 */
const removeNodeAndNewLine =
    (sourceCode: SourceCode) =>
    (node: TSESTree.Node): RuleFix[] => {
        const currentLine = node?.loc?.start?.line;
        const nextToken = sourceCode.getTokenAfter(node);
        const nextTokenLine = nextToken?.loc?.start?.line;

        if (nextToken != null && currentLine !== nextTokenLine) {
            return [remove(node), removeBetween(node, nextToken)];
        }

        return [remove(node)];
    };

const removeImportClause =
    (sourceCode: SourceCode) =>
    (clause: TSESTree.ImportClause): RuleFix[] => {
        const fixes: RuleFix[] = [];
        fixes.push(remove(clause));

        // We need to clean up the trailing comma and whitespace between the next identifier
        const [maybeComma, maybeIdentifier] = sourceCode.getTokensAfter(
            clause,
            2
        );

        if (isCommaToken(maybeComma)) {
            fixes.push(remove(maybeComma));
        }

        const hasWhitespaceToRemove =
            isIdentifierToken(maybeIdentifier) &&
            maybeIdentifier.value !== "from" &&
            sourceCode.isSpaceBetween?.(maybeComma, maybeIdentifier) === true;

        if (hasWhitespaceToRemove) {
            fixes.push(removeBetween(maybeComma, maybeIdentifier));
        }

        // If we're removing the last import in the list, we also need to clean up the comma token before it
        const previousToken = sourceCode.getTokenBefore(clause);

        const isLastImportSpecifier =
            isCommaToken(previousToken) &&
            isIdentifierToken(maybeIdentifier, "from");
        if (isLastImportSpecifier) {
            fixes.push(remove(previousToken));
        }

        return fixes;
    };

export {
    insertTextAfter,
    insertTextAfterRange,
    insertTextBefore,
    insertTextBeforeRange,
    remove,
    removeImportClause,
    removeNodeAndNewLine,
    removeRange,
    replaceText,
    replaceTextRange,
};
