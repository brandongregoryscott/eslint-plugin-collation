import { hasSameOrder } from "../utils/collection-utils";
import { orderBy } from "lodash";
import { isArrayExpression, isIdentifier } from "../utils/node-utils";
import { createRule } from "../utils/create-rule";
import { printList, readList } from "../utils/commented-list";

const HOOK_NAMES = ["useEffect", "useMemo", "useCallback"];

const sortDependencyList = createRule({
    name: "sort-dependency-list",
    meta: {
        type: "suggestion",
        docs: { description: "Sort hook dependencies." },
        fixable: "code",
        schema: [],
        messages: { sortDependencyList: "Sort the dependency list." },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        return {
            CallExpression(node) {
                if (
                    !isIdentifier(node.callee) ||
                    !HOOK_NAMES.includes(node.callee.name)
                ) {
                    return;
                }

                const list = node.arguments[1];

                if (
                    !isArrayExpression(list) ||
                    list.elements.some((element) => element == null)
                ) {
                    return;
                }

                const items = readList(
                    source,
                    list.elements.filter((element) => element != null),
                    list.range
                );

                const sorted = orderBy(
                    items,
                    [(item) => item.text.toLowerCase(), (item) => item.text],
                    ["asc", "desc"]
                );

                if (hasSameOrder(items, sorted)) {
                    return;
                }

                context.report({
                    node: list,
                    messageId: "sortDependencyList",
                    fix: (fixer) =>
                        fixer.replaceText(
                            list,
                            printList(source, sorted, "[]")
                        ),
                });
            },
        };
    },
});

export { sortDependencyList };
