import { namedExportsOnly } from "./named-exports-only";
import { createSourceFile } from "../test/test-utils";

describe("namedExportsOnly", () => {
    it("should convert default exports to named exports", async () => {
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
    });
});
