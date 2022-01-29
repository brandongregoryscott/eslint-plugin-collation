import { Project } from "ts-morph";
import { createSourceFile } from "../test/test-utils";
import { alphabetizeInterfaces } from "./alphabetize-interfaces";

describe("alphabetizeInterfaces", () => {
    it("should sort properties in interface when there are unsorted properties", async () => {
        // Arrange
        const input = createSourceFile(
            `
                interface Example {
                    zeta?: string;
                    beta: Record<string, string>;
                    alpha: number;
                    omicron: () => void;
                }
            `
        );

        const expected = createSourceFile(
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
        await result.file.save();
    });

    it("should sort properties in all interfaces when there are multiple unsorted interfaces", async () => {
        // Arrange
        const input = createSourceFile(
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

        const expected = createSourceFile(
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
        await result.file.save();
    });

    it("should sort properties with multi-line comments", async () => {
        // Arrange
        const input = createSourceFile(
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

        const expected = createSourceFile(
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
        await result.file.save();
    });

    it("should sort properties with single-line comments", async () => {
        // Arrange
        const input = createSourceFile(
            `
                interface Car {
                    // Make of the car
                    make: string;
                    // Number of wheels the car has
                    wheels: number;
                    // Model of the car
                    model: string;
                }
            `
        );

        const expected = createSourceFile(
            `
                interface Car {
                    // Make of the car
                    make: string;
                    // Model of the car
                    model: string;
                    // Number of wheels the car has
                    wheels: number;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });

    it("should not fail to save", async () => {
        // Arrange
        const input = createSourceFile(
            `
                interface Instrument extends Auditable {
                    curve: InstrumentCurve;
                    /**
                     * Note:
                     * This is a Foreign Key to \`files.id\`.<fk table='files' column='id'/>
                     */
                    file_id: string;
                    name: string;
                    release?: number;
                    root_note?: string;
                    duration?: number;
                }
            `
        );

        const expected = createSourceFile(
            `
                interface Instrument extends Auditable {
                    curve: InstrumentCurve;
                    duration?: number;
                    /**
                     * Note:
                     * This is a Foreign Key to \`files.id\`.<fk table='files' column='id'/>
                     */
                    file_id: string;
                    name: string;
                    release?: number;
                    root_note?: string;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });

    it.skip("#24 should sort nested object properties", async () => {
        // Arrange
        const input = createSourceFile(
            `
                interface Release {
                    assets: any[];
                    author: {
                        login: string;
                        id: number;
                        avatar_url: string;
                        gravatar_id: string;
                        type: string;
                        site_admin: boolean;
                    };
                    html_url: string;
                    name: string;
                    id: number;
                    zipball_url: string;
                }
            `
        );

        const expected = createSourceFile(
            `
                interface Release {
                    assets: any[];
                    author: {
                        avatar_url: string;
                        gravatar_id: string;
                        id: number;
                        login: string;
                        site_admin: boolean;
                        type: string;
                    };
                    html_url: string;
                    id: number;
                    name: string;
                    zipball_url: string;
                }
            `
        );

        // Act
        const result = await alphabetizeInterfaces(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });
});
