import { TSESTree } from "@typescript-eslint/utils";

type ComponentType =
    | TSESTree.FunctionDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ClassDeclaration;

export { ComponentType };
