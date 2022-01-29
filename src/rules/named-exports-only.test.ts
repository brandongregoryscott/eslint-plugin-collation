import { namedExportsOnly } from "./named-exports-only";
import { createSourceFile } from "../test/test-utils";

describe("namedExportsOnly", () => {
    it("should convert default export to named export at end of file", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export default useInput;
            `
        );

        const expected = createSourceFile(
            `
                const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export { useInput };
            `
        );

        // Act
        const result = await namedExportsOnly(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });

    it("should convert inline default export to named export", async () => {
        // Arrange
        const input = createSourceFile(
            `
                export default function useInput(options?: UseInputOptions) {
                    // ...implementation
                }
            `
        );

        const expected = createSourceFile(
            `
                export function useInput(options?: UseInputOptions) {
                    // ...implementation
                }
            `
        );

        // Act
        const result = await namedExportsOnly(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
        await result.file.save();
    });
});
