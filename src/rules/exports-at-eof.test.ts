import { exportsAtEof } from "./exports-at-eof";
import {
    createInMemoryProject,
    createSourceFile,
    CreateSourceFileOptions,
} from "../test/test-utils";

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

    it("should not return errors when exports are already at end of file", async () => {
        // Arrange
        const input = createSourceFile(
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
        expect(result).not.toHaveErrors();
        expect(result).toMatchSourceFile(input);
    });

    describe("default exports", () => {
        it("should convert default exports to named exports", async () => {
            // Arrange
            const input = createSourceFile(
                `
                    interface UseInputOptions {
                        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                        value?: string;
                    }

                    export default function useInput(options?: UseInputOptions) {
                        // ...implementation
                    }

                    export { UseInputOptions };
                `
            );

            const expected = createSourceFile(
                `
                    interface UseInputOptions {
                        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                        value?: string;
                    }

                    function useInput(options?: UseInputOptions) {
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

        it("should update referencing SourceFiles to use named import", async () => {
            // Arrange
            // We need to use the same Project instance to get referencing source files
            const project = createInMemoryProject();
            const options: CreateSourceFileOptions = {
                project,
                // There's currently a bug in ts-morph where references won't be returned in .tsx files
                extension: ".ts",
            };

            const input = createSourceFile(
                `
                    interface UseInputOptions {
                        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                        value?: string;
                    }

                    export default function useInput(options?: UseInputOptions) {
                        // ...implementation
                    }

                    export { UseInputOptions };
                `,
                options
            );
            const referencingSourceFile = createSourceFile(
                `
                    import useInput from "./${input.getBaseNameWithoutExtension()}";
                `,
                options
            );

            const expected = createSourceFile(
                `
                    import { useInput } from "./${input.getBaseNameWithoutExtension()}";
                `,
                options
            );

            // Act
            await exportsAtEof(input);

            // Assert
            expect(referencingSourceFile).toMatchSourceFile(expected);
        });
    });

    describe("type only exports", () => {
        it("should not attach non-type exports to type export", async () => {
            // Arrange
            const input = createSourceFile(
                `
                interface UseInputOptions {
                    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                    value?: string;
                }

                export const useInput = (options?: UseInputOptions) => {
                    // ...implementation
                }

                export type { UseInputOptions };
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

                export type { UseInputOptions };
                export { useInput }
            `
            );

            // Act
            const result = await exportsAtEof(input);

            // Assert
            expect(result).toHaveErrors();
            expect(result).toMatchSourceFile(expected);
        });
    });
});

export {};
export {};
