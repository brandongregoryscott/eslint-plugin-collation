import { isEmpty, isArray, kebabCase } from "lodash";
import {
    isIdentifier,
    isImportDeclaration,
    isImportSpecifier,
    isJSXClosingElement,
} from "../utils/node-utils";
import type { JSONSchema, TSESTree } from "@typescript-eslint/utils";
import { minimatch } from "minimatch";
import { createRule } from "../utils/create-rule";
import { printList, readList } from "../utils/commented-list";
import type { ListItem } from "../utils/commented-list";

interface ImportReplacement {
    importName: string | string[];
    replaceAsDefault?: boolean;
    replacementModuleSpecifier: string;
    transformImportName?: "kebab-case";
}

type PreferImportOptions = Record<
    string,
    ImportReplacement | ImportReplacement[]
>;

interface ReplacementGroup {
    items: ListItem[];
    module: string;
    names: string[];
    rule: ImportReplacement;
    specifiers: TSESTree.ImportSpecifier[];
}

const replacementSchema: JSONSchema.JSONSchema4 = {
    type: "object",
    properties: {
        importName: {
            anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
            ],
        },
        replaceAsDefault: { type: "boolean" },
        replacementModuleSpecifier: { type: "string" },
        transformImportName: { type: "string", enum: ["kebab-case"] },
    },
    required: ["importName", "replacementModuleSpecifier"],
    additionalProperties: false,
};

const preferImport = createRule<
    [PreferImportOptions],
    "preferImport" | "preferImportMultiple" | "bannedGlobalType"
>({
    name: "prefer-import",
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Prefer configured imports over other modules or globals.",
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                additionalProperties: {
                    anyOf: [
                        replacementSchema,
                        { type: "array", items: replacementSchema },
                    ],
                },
            },
        ],
        messages: {
            preferImport:
                "Import '{{importName}}' from '{{replacementModuleSpecifier}}'.",
            preferImportMultiple: "{{message}}",
            bannedGlobalType:
                "Import '{{importName}}' from '{{replacementModuleSpecifier}}' instead of using the global.",
        },
    },
    defaultOptions: [{}],
    create(context, [options]) {
        const source = context.sourceCode;

        const asArray = (
            rules: ImportReplacement | ImportReplacement[] | undefined
        ) => (rules == null ? [] : isArray(rules) ? rules : [rules]);

        const importedName = (specifier: TSESTree.ImportSpecifier) =>
            isIdentifier(specifier.imported)
                ? specifier.imported.name
                : String(specifier.imported.value);

        function destination(rule: ImportReplacement, name: string) {
            // Paste's Props exports live beside their components.
            const transformed =
                rule.transformImportName === "kebab-case"
                    ? kebabCase(name.replace(/Props$/, ""))
                    : name;

            return rule.replacementModuleSpecifier.replaceAll(
                "{importName}",
                transformed
            );
        }

        function printReplacement(
            group: ReplacementGroup,
            declaration: TSESTree.ImportDeclaration
        ): string[] {
            const typeOnly = declaration.importKind === "type";

            if (group.rule.replaceAsDefault !== true) {
                return [
                    `import ${typeOnly ? "type " : ""}${printList(
                        source,
                        group.items
                    )} from '${group.module}';`,
                ];
            }

            return group.specifiers.map((specifier, index) => {
                const item = group.items[index];
                const inside = source.getCommentsInside(specifier);
                const comments = [...item.leading, ...inside];

                const prefix = comments
                    .map(
                        (comment) =>
                            `${source.getText(comment)}${
                                comment.type === "Line" ? "\n" : " "
                            }`
                    )
                    .join("");

                const tail = item.trailing
                    .map((comment) => ` ${source.getText(comment)} `)
                    .join("");

                return `${prefix}import ${
                    typeOnly || specifier.importKind === "type" ? "type " : ""
                }${specifier.local.name} from '${group.module}';${tail}`;
            });
        }

        function planReplacements(node: TSESTree.ImportDeclaration) {
            const rules = asArray(options[String(node.source.value)]);
            const specifiers = node.specifiers.filter(isImportSpecifier);
            const items = readList(source, specifiers, node.range);
            const moved = new Set<TSESTree.ImportSpecifier>();
            const groups: ReplacementGroup[] = [];

            // Earlier entries win. Static destinations group their matches;
            // templates intentionally produce one declaration per match.
            for (const rule of rules) {
                let staticGroup: ReplacementGroup | undefined;

                const patterns = isArray(rule.importName)
                    ? rule.importName
                    : [rule.importName];

                for (let index = 0; index < specifiers.length; index++) {
                    const specifier = specifiers[index];
                    const name = importedName(specifier);

                    if (
                        moved.has(specifier) ||
                        !patterns.some((pattern) => minimatch(name, pattern))
                    ) {
                        continue;
                    }

                    const module = destination(rule, name);

                    if (module === node.source.value) {
                        continue;
                    }

                    let group = staticGroup;

                    if (
                        group == null ||
                        rule.replacementModuleSpecifier.includes(
                            "{importName}"
                        ) ||
                        rule.replaceAsDefault === true
                    ) {
                        group = {
                            items: [],
                            module,
                            names: [],
                            rule,
                            specifiers: [],
                        };
                        groups.push(group);
                        staticGroup = group;
                    }

                    group.items.push(items[index]);
                    group.names.push(name);
                    group.specifiers.push(specifier);
                    moved.add(specifier);
                }
            }

            return {
                groups,
                remaining: specifiers.flatMap((specifier, index) =>
                    moved.has(specifier) ? [] : [items[index]]
                ),
            };
        }

        function remainingImport(
            node: TSESTree.ImportDeclaration,
            remaining: ListItem[]
        ): string | undefined {
            const other = node.specifiers.filter(
                (specifier) => !isImportSpecifier(specifier)
            );

            if (isEmpty(remaining) && isEmpty(other)) {
                return undefined;
            }

            const parts = other.map((specifier) => source.getText(specifier));

            if (!isEmpty(remaining)) {
                parts.push(printList(source, remaining));
            }

            return `import ${
                node.importKind === "type" ? "type " : ""
            }${parts.join(", ")} from ${source.getText(node.source)}${
                source.getLastToken(node)?.value === ";" ? ";" : ""
            }`;
        }

        function checkImport(node: TSESTree.ImportDeclaration) {
            const { groups, remaining } = planReplacements(node);

            if (isEmpty(groups)) {
                return;
            }

            const modules = new Map<string, string[]>();

            for (const group of groups) {
                modules.set(group.module, [
                    ...(modules.get(group.module) ?? []),
                    ...group.names,
                ]);
            }

            const phrases = [...modules].map(
                ([module, names]) => `'${names.join(", ")}' from '${module}'`
            );

            const message =
                phrases.length === 1
                    ? `Import ${phrases[0]}.`
                    : `Import ${phrases.slice(0, -1).join(", ")}, and ${
                          phrases[phrases.length - 1]
                      }.`;

            context.report({
                node,
                messageId:
                    modules.size === 1
                        ? "preferImport"
                        : "preferImportMultiple",
                data: {
                    importName: groups
                        .flatMap((group) => group.names)
                        .join(", "),
                    replacementModuleSpecifier: groups[0].module,
                    message,
                },
                fix(fixer) {
                    const output = groups.flatMap((group) =>
                        printReplacement(group, node)
                    );

                    const leftover = remainingImport(node, remaining);

                    if (leftover !== undefined) {
                        output.push(leftover);
                    }

                    const staticNamedOnly =
                        groups.length === 1 &&
                        !groups[0].rule.replacementModuleSpecifier.includes(
                            "{importName}"
                        ) &&
                        groups[0].rule.replaceAsDefault !== true;

                    // Preserve the trailing newline specified by the tests for
                    // a complete static replacement without comments.
                    const extraNewline =
                        staticNamedOnly &&
                        leftover == null &&
                        isEmpty(source.getCommentsInside(node));

                    return fixer.replaceText(
                        node,
                        output.join("\n") + (extraNewline ? "\n" : "")
                    );
                },
            });
        }

        function checkGlobals(program: TSESTree.Program) {
            const rules = asArray(options.global);

            if (isEmpty(rules)) {
                return;
            }

            const imports = program.body.filter((node) =>
                isImportDeclaration(node)
            );

            const lastImport = imports[imports.length - 1];
            const seen = new Set<number>();

            for (const scope of source.scopeManager?.scopes ?? []) {
                for (const reference of scope.references) {
                    const identifier = reference.identifier;

                    if (isJSXClosingElement(identifier.parent)) {
                        continue;
                    }

                    if (
                        seen.has(identifier.range[0]) ||
                        (reference.resolved != null &&
                            !isEmpty(reference.resolved.defs))
                    ) {
                        continue;
                    }

                    const rule = rules.find((candidate) =>
                        (isArray(candidate.importName)
                            ? candidate.importName
                            : [candidate.importName]
                        ).includes(identifier.name)
                    );

                    if (rule == null) {
                        continue;
                    }

                    seen.add(identifier.range[0]);

                    const module = destination(rule, identifier.name);

                    context.report({
                        node: identifier,
                        messageId: "bannedGlobalType",
                        data: {
                            importName: identifier.name,
                            replacementModuleSpecifier: module,
                        },
                        fix(fixer) {
                            const statement = `import ${
                                rule.replaceAsDefault === true
                                    ? identifier.name
                                    : `{ ${identifier.name} }`
                            } from '${module}';`;

                            return lastImport == null
                                ? fixer.insertTextBeforeRange(
                                      [0, 0],
                                      `${statement}\n\n`
                                  )
                                : fixer.insertTextAfter(
                                      lastImport,
                                      `\n${statement}\n`
                                  );
                        },
                    });
                }
            }
        }

        return { ImportDeclaration: checkImport, "Program:exit": checkGlobals };
    },
});

export type { PreferImportOptions };
export { preferImport };
