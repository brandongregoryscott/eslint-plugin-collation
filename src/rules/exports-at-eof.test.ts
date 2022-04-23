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

    it("should move existing named exports to end of file when they appear before", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const add = (x: number, y: number) => x + y;

                const subtract = (x: number, y: number) => x - y;

                export { add, subtract };

                const multiply = (x: number, y: number) => x * y;
            `
        );

        const expected = createSourceFile(
            `
                const add = (x: number, y: number) => x + y;

                const subtract = (x: number, y: number) => x - y;

                const multiply = (x: number, y: number) => x * y;

                export { add, subtract };
            `
        );

        // Act
        const result = await exportsAtEof(input);

        // Assert
        expect(result).toMatchSourceFile(expected);
    });

    it("should consolidate non-type exports when multiple statements exist", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const add = (x: number, y: number) => x + y;

                const subtract = (x: number, y: number) => x - y;

                export { add };
                export { subtract };
            `
        );

        const expected = createSourceFile(
            `
                const add = (x: number, y: number) => x + y;

                const subtract = (x: number, y: number) => x - y;

                export { add, subtract };
            `
        );

        // Act
        const result = await exportsAtEof(input);

        // Assert
        expect(result).toMatchSourceFile(expected);
    });

    it("should consolidate mixed exports when multiple statements exist", async () => {
        // Arrange
        const input = createSourceFile(
            `
                type AddFunction = (x: number, y: number) => number;
                type SubtractFunction = (x: number, y: number) => number;

                const add: AddFunction = (x: number, y: number) => x + y;

                const subtract: SubtractFunction = (x: number, y: number) => x - y;

                export type { AddFunction };
                export type { SubtractFunction };
                export { add };
                export { subtract };
            `
        );

        // Unsure why the code is adding additional whitespace, but ignore it for now
        const expected = createSourceFile(
            `
                type AddFunction = (x: number, y: number) => number;
                type SubtractFunction = (x: number, y: number) => number;

                const add: AddFunction = (x: number, y: number) => x + y;

                const subtract: SubtractFunction = (x: number, y: number) => x - y;

                export type { AddFunction, SubtractFunction };
                export {     add, subtract };
            `
        );

        // Act
        const result = await exportsAtEof(input);

        // Assert
        expect(result).toMatchSourceFile(expected);
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

                    export { UseInputOptions, useInput };
                `
            );

            // Act
            const result = await exportsAtEof(input);

            // Assert
            expect(result).toHaveErrors();
            expect(result).toMatchSourceFile(expected);
        });

        it("should consolidate type exports when multiple statements exist", async () => {
            // Arrange
            const input = createSourceFile(
                `
                    type AddFunction = (x: number, y: number) => number;
                    type SubtractFunction = (x: number, y: number) => number;

                    export type { AddFunction };
                    export type { SubtractFunction };
                `
            );

            const expected = createSourceFile(
                `
                    type AddFunction = (x: number, y: number) => number;
                    type SubtractFunction = (x: number, y: number) => number;

                    export type { AddFunction, SubtractFunction };
                `
            );

            // Act
            const result = await exportsAtEof(input);

            // Assert
            expect(result).toMatchSourceFile(expected);
        });

        describe("when isolatedModules is true", () => {
            it("should create both type and non-type exports", async () => {
                // Arrange
                const project = createInMemoryProject({
                    compilerOptions: { isolatedModules: true },
                });
                const input = createSourceFile(
                    `
                        export interface UseInputOptions {
                            onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                            value?: string;
                        }

                        export const useInput = (options?: UseInputOptions) => {
                            // ...implementation
                        }
                    `,
                    { project }
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
                        export { useInput };
                    `,
                    { project }
                );

                // Act
                const result = await exportsAtEof(input);

                // Assert
                expect(result).toHaveErrors();
                expect(result).toMatchSourceFile(expected);
            });

            it("should create separate type export when existing non-type export exists", async () => {
                // Arrange
                const project = createInMemoryProject({
                    compilerOptions: { isolatedModules: true },
                });
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
                    `,
                    { project }
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
                        export { useInput };
                    `,
                    { project }
                );

                // Act
                const result = await exportsAtEof(input);

                // Assert
                expect(result).toHaveErrors();
                expect(result).toMatchSourceFile(expected);
            });

            it("should update existing type export", async () => {
                // Arrange
                const project = createInMemoryProject({
                    compilerOptions: { isolatedModules: true },
                });

                const input = createSourceFile(
                    `
                        type Example = string | number;

                        export interface UseInputOptions {
                            onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                            value?: string;
                        }

                        export const useInput = (options?: UseInputOptions) => {
                            // ...implementation
                        }

                        export type { Example };
                    `,
                    { project }
                );

                const expected = createSourceFile(
                    `
                        type Example = string | number;

                        interface UseInputOptions {
                            onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                            value?: string;
                        }

                        const useInput = (options?: UseInputOptions) => {
                            // ...implementation
                        }

                        export type { Example, UseInputOptions };
                        export { useInput };
                    `,
                    { project }
                );

                // Act
                const result = await exportsAtEof(input);

                // Assert
                expect(result).toHaveErrors();
                expect(result).toMatchSourceFile(expected);
            });
        });
    });
});
