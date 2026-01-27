/**
 * @typedef {import('eslint').Rule.RuleModule} RuleModule
 * @typedef {import('eslint').Rule.RuleContext} RuleContext
 * @typedef {import('eslint').AST.Token} Token
 * @typedef {object} PropertyNode
 * @property {object} key
 * @property {string} key.name
 * @typedef {object} MethodNode
 * @property {object} key
 * @property {string} key.name
 * @typedef {object} ReportDescriptor
 * @property {any} node
 * @property {string} messageId
 * @property {object} data
 * @property {string} data.name
 * @property {Function} fix
 */

/**
 * ESLint rule to prefer native #private class members over TypeScript private modifier
 * @type {RuleModule}
 */
const preferNativePrivateSyntax = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Prefer native #private class members over TypeScript private modifier",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        messages: {
            preferPrivateHash:
                "Use native `#{{name}}` syntax instead of TypeScript `private {{name}}` for true runtime privacy.",
        },
        schema: [],
    },

    /**
     * @param {RuleContext} context - The rule context
     * @returns {object} Selector object with AST visitor methods
     */
    create(context) {
        const sourceCode = context.getSourceCode();

        return {
            /**
             * Visitor for private property definitions
             * @param {PropertyNode & any} node - The PropertyDefinition node
             * @returns {void}
             */
            'PropertyDefinition[accessibility="private"]'(node) {
                /** @type {string} */
                const memberName = node.key.name;

                context.report({
                    node,
                    messageId: "preferPrivateHash",
                    data: { name: memberName },
                    /**
                     * @param {import('eslint').Rule.RuleFixer} fixer - The fixer object
                     * @returns {Array<import('eslint').Rule.Fix>} Array of fix operations
                     */
                    fix(fixer) {
                        /** @type {Array<import('eslint').Rule.Fix>} */
                        const fixes = [];

                        // Remove 'private ' modifier
                        /** @type {Token|null} */
                        const privateKeyword = sourceCode.getFirstToken(node);
                        if (
                            privateKeyword &&
                            privateKeyword.value === "private"
                        ) {
                            fixes.push(fixer.remove(privateKeyword));
                            // Remove space after 'private'
                            /** @type {Token|null} */
                            const nextToken =
                                sourceCode.getTokenAfter(privateKeyword);
                            if (nextToken) {
                                const spaceRange = [
                                    privateKeyword.range[1],
                                    nextToken.range[0],
                                ];
                                fixes.push(fixer.removeRange(spaceRange));
                            }
                        }

                        // Add # prefix to property name
                        fixes.push(
                            fixer.replaceText(node.key, `#${memberName}`)
                        );

                        return fixes;
                    },
                });
            },

            /**
             * Visitor for private method definitions
             * @param {MethodNode & any} node - The MethodDefinition node
             * @returns {void}
             */
            'MethodDefinition[accessibility="private"]'(node) {
                /** @type {string} */
                const memberName = node.key.name;

                context.report({
                    node,
                    messageId: "preferPrivateHash",
                    data: { name: memberName },
                    /**
                     * @param {import('eslint').Rule.RuleFixer} fixer - The fixer object
                     * @returns {Array<import('eslint').Rule.Fix>} Array of fix operations
                     */
                    fix(fixer) {
                        /** @type {Array<import('eslint').Rule.Fix>} */
                        const fixes = [];

                        // Remove 'private ' modifier
                        /** @type {Token|null} */
                        const privateKeyword = sourceCode.getFirstToken(node);
                        if (
                            privateKeyword &&
                            privateKeyword.value === "private"
                        ) {
                            fixes.push(fixer.remove(privateKeyword));
                            // Remove space after 'private'
                            /** @type {Token|null} */
                            const nextToken =
                                sourceCode.getTokenAfter(privateKeyword);
                            if (nextToken) {
                                const spaceRange = [
                                    privateKeyword.range[1],
                                    nextToken.range[0],
                                ];
                                fixes.push(fixer.removeRange(spaceRange));
                            }
                        }

                        // Add # prefix to method name
                        fixes.push(
                            fixer.replaceText(node.key, `#${memberName}`)
                        );

                        return fixes;
                    },
                });
            },
        };
    },
};

export { preferNativePrivateSyntax };
