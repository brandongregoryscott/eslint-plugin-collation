import type { TSESTree } from "@typescript-eslint/utils";

type Declaration =
    | TSESTree.ClassDeclaration
    | TSESTree.FunctionDeclaration
    | TSESTree.TSEnumDeclaration
    | TSESTree.VariableDeclaration;

export type { Declaration };
