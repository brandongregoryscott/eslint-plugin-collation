import type { TSESTree } from "@typescript-eslint/utils";

type ComponentType =
    TSESTree.ClassDeclaration | TSESTree.FunctionDeclaration | TSESTree.VariableDeclaration;

export type { ComponentType };
