import { TSESTree } from "@typescript-eslint/utils";

type Declaration =
    | TSESTree.ClassDeclaration
    | TSESTree.TSEnumDeclaration
    | TSESTree.FunctionDeclaration
    | TSESTree.VariableDeclaration;

export type { Declaration };
