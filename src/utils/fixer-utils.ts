import type { TSESTree } from "@typescript-eslint/utils";
import type {
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";

/**
 * Removes the node and the new line character, if one exists between the node and the next token
 */
const removeNodeAndNewLine = (
    fixer: RuleFixer,
    node: TSESTree.Node,
    sourceCode: SourceCode
): RuleFix[] => {
    const currentLine = node?.loc?.start?.line;
    const nextToken = sourceCode.getTokenAfter(node);
    const nextTokenLine = nextToken?.loc?.start?.line;

    if (nextToken != null && currentLine !== nextTokenLine) {
        return [
            fixer.remove(node),
            fixer.removeRange([node.range[1], nextToken.range[0]]),
        ];
    }

    return [fixer.remove(node)];
};

export { removeNodeAndNewLine };
