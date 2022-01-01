import { Project } from "ts-morph";
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
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
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
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort properties with multi-line comments", async () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.ts",
            `
                interface Car {
                    /*
                     * Make of the car
                     */
                    make: string;
                    /*
                     * Number of wheels the car has
                     */
                    wheels: number;
                    /*
                     * Model of the car
                     */
                    model: string;
                }
            `
        );

        const expected = project.createSourceFile(
            "expected.ts",
            `
                interface Car {
                    /*
                     * Make of the car
                     */
                    make: string;
                    /*
                     * Model of the car
                     */
                    model: string;
                    /*
                     * Number of wheels the car has
                     */
                    wheels: number;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });
});
