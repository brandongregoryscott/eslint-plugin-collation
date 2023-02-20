import type { TSESTree } from "@typescript-eslint/utils";

interface NamedExport {
    kind: "type" | "value";
    module: string | undefined;
    reference: TSESTree.ExportNamedDeclaration;
    specifiers: string[];
}

export type { NamedExport };
