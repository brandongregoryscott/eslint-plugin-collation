import { Project } from "ts-morph";
import { alphabetizeInterfaces } from "./alphabetize-interfaces";

describe("alphabetizeInterfaces", () => {
    it("should sort properties in interface when there are unsorted properties", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const _interface = `
            interface Example {
                zeta?: string;
                beta: Record<string, string>;
                alpha: number;
                omicron: () => void;
            }
        `;

        const expected = `
            interface Example {
                alpha: number;
                beta: Record<string, string>;
                omicron: () => void;
                zeta?: string;
            }
        `;
        const file = project.createSourceFile("interface.ts", _interface);

        // Act
        const result = alphabetizeInterfaces(file);

        // Assert
        expect(result.file.getFullText()).toStrictEqual(expected);
    });

    it("should sort properties in all interfaces when there are multiple unsorted interfaces", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const _interface = `
            interface Car {
                make: string;
                wheels: number;
                model: string;
            }

            interface Dog {
                name: string;
                legs: number;
            }
        `;

        const expected = `
            interface Car {
                make: string;
                model: string;
                wheels: number;
            }

            interface Dog {
                legs: number;
                name: string;
            }
        `;
        const file = project.createSourceFile("interface.ts", _interface);

        // Act
        const result = alphabetizeInterfaces(file);

        // Assert
        expect(result.file.getFullText()).toStrictEqual(expected);
    });
});
