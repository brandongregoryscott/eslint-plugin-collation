import { VariableDeclaration, VariableStatement } from "ts-morph";
import {
    asExportedNode,
    getExportedDeclarations,
} from "./exported-declarations-utils";

describe("ExportedDeclarationsUtils", () => {
    describe(asExportedNode.name, () => {
        it.todo(
            "should return undefined when node is not exportable",
            () => {}
        );

        describe(`${VariableStatement.name} and ${VariableDeclaration.name}`, () => {
            it.todo(
                `should return ${VariableStatement.name} when node is ${VariableDeclaration.name}`,
                () => {}
            );

            it.todo(
                `should return undefined when node is ${VariableDeclaration.name} and ${VariableStatement.name} can't be found`,
                () => {}
            );
        });
    });

    describe(getExportedDeclarations.name, () => {
        it.todo("should return flattened ExportedDeclarations", () => {});
    });
});
