import { Project } from "ts-morph";
import { expectSourceFilesToMatch } from "../test/matchers";
import { alphabetizeInterfaces } from "./alphabetize-interfaces";

describe("alphabetizeInterfaces", () => {
    it("should sort properties in interface when there are unsorted properties", async () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.ts",
            `
                interface Example {
                    zeta?: string;
                    beta: Record<string, string>;
                    alpha: number;
                    omicron: () => void;
                }
            `
        );

        const expected = project.createSourceFile(
            "expected.ts",
            `
                interface Example {
                    alpha: number;
                    beta: Record<string, string>;
                    omicron: () => void;
                    zeta?: string;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expectSourceFilesToMatch(result.file, expected);
    });

    it("should sort properties in all interfaces when there are multiple unsorted interfaces", async () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.ts",
            `
                interface Car {
                    make: string;
                    wheels: number;
                    model: string;
                }

                interface Dog {
                    name: string;
                    legs: number;
                }
            `
        );

        const expected = project.createSourceFile(
            "expected.ts",
            `
                interface Car {
                    make: string;
                    model: string;
                    wheels: number;
                }

                interface Dog {
                    legs: number;
                    name: string;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expectSourceFilesToMatch(result.file, expected);
    });
});
