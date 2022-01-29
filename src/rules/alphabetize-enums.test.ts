import { createSourceFile } from "../test/test-utils";
import { alphabetizeEnums } from "./alphabetize-enums";

describe("alphabetizeEnums", () => {
    it("should alphabetize explicit string-based enums by key", async () => {
        const input = createSourceFile(
            `
                enum Animals {
                    Dog = "dog",
                    Wolf = "wolf",
                    Cat = "cat",
                }
            `
        );

        const expected = createSourceFile(
            `
                enum Animals {
                    Cat = "cat",
                    Dog = "dog",
                    Wolf = "wolf",
                }
            `
        );

        const result = await alphabetizeEnums(input);

        expect(result).toMatchSourceFile(expected);
        expect(result).toHaveErrors();
        await result.file.save();
    });

    it("should alphabetize explicit number-based enums by key", async () => {
        const input = createSourceFile(
            `
                enum SortOrder {
                    DESC = 0,
                    ASC = 1,
                }
            `
        );

        const expected = createSourceFile(
            `
                enum SortOrder {
                    ASC = 1,
                    DESC = 0,
                }
            `
        );

        const result = await alphabetizeEnums(input);

        expect(result).toMatchSourceFile(expected);
        expect(result).toHaveErrors();
        await result.file.save();
    });

    it("should not modify implicit-numeric enums", async () => {
        // Arrange
        const input = createSourceFile(
            `
                enum Car {
                    Make,
                    Wheels,
                    Model,
                }
            `
        );

        const expected = createSourceFile(
            `
                enum Car {
                    Make,
                    Wheels,
                    Model,
                }
            `
        );

        // Act
        const result = await alphabetizeEnums(input);

        // Assert
        expect(result).not.toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });

    it("should alphabetize members with multi-line comments", async () => {
        // Arrange
        const input = createSourceFile(
            `
                enum Car {
                    /* Make of the car */
                    Make = "make",
                    /* Number of wheels the car has */
                    Wheels = "wheels",
                    /* Model of the car */
                    Model = "model",
                }
            `
        );

        const expected = createSourceFile(
            `
                enum Car {
                    /* Make of the car */
                    Make = "make",
                    /* Model of the car */
                    Model = "model",
                    /* Number of wheels the car has */
                    Wheels = "wheels",
                }
            `
        );

        // Act
        const result = await alphabetizeEnums(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });

    it("should alphabetize members with single-line comments", async () => {
        // Arrange
        const input = createSourceFile(
            `
                enum Car {
                    // Make of the car
                    Make = "make",
                    // Number of wheels the car has
                    Wheels = "wheels",
                    // Model of the car
                    Model = "model",
                }
            `
        );

        const expected = createSourceFile(
            `
                enum Car {
                    // Make of the car
                    Make = "make",
                    // Model of the car
                    Model = "model",
                    // Number of wheels the car has
                    Wheels = "wheels",
                }
            `
        );

        // Act
        const result = await alphabetizeEnums(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });
});
