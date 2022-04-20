import { exportsAtEof } from "./exports-at-eof";
import { createSourceFile } from "../test/test-utils";

describe("exportsAtEof", () => {
    it("should move in-line exports to end of file", async () => {
        // Arrange
        const input = createSourceFile(
            `
                export interface UseInputOptions {
                    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                    value?: string;
                }

                export const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }
            `
        );

        const expected = createSourceFile(
            `
                interface UseInputOptions {
                    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                    value?: string;
                }

                const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export { UseInputOptions, useInput };
            `
        );

        // Act
        const result = await exportsAtEof(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should update existing export when there is one", async () => {
        // Arrange
        const input = createSourceFile(
            `
                export interface UseInputOptions {
                    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                    value?: string;
                }

                const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export { useInput };
            `
        );

        const expected = createSourceFile(
            `
                interface UseInputOptions {
                    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                    value?: string;
                }

                const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export { useInput, UseInputOptions };
            `
        );

        // Act
        const result = await exportsAtEof(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });
});
