import { namedExportsOnly } from "./named-exports-only";
import {
    createInMemoryProject,
    createSourceFile,
    CreateSourceFileOptions,
} from "../test/test-utils";

describe("namedExportsOnly", () => {
    describe("default export at end of file", () => {
        it("should convert named export at end of file", async () => {
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

        it("should convert default imports to named imports in referencing files", async () => {
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
                    const noop = () => {};

                    export default noop;
                `,
                options
            );

            const referencingFile = createSourceFile(
                `
                    import noop from "./${input.getBaseNameWithoutExtension()}";

                    noop();
                `,
                options
            );

            const expected = createSourceFile(
                `
                    import { noop } from "./${input.getBaseNameWithoutExtension()}";

                    noop();
                `,
                options
            );

            // Act
            const result = await namedExportsOnly(input);

            // Assert
            expect(referencingFile).toMatchSourceFile(expected);
            await result.file.save();
        });
    });

    describe("inline default export", () => {
        it("should convert to inline named export", async () => {
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

        it("should convert default imports to named imports in referencing files", async () => {
            // Arrange
            // We need to use the same Project instance to get referencing source files
            const project = createInMemoryProject();
            const options: CreateSourceFileOptions = {
                project,
                extension: ".ts",
            };
            const input = createSourceFile(
                `
                    export default function noop() {};
                `,
                options
            );

            const referencingFile = createSourceFile(
                `
                    import noop from "./${input.getBaseNameWithoutExtension()}";

                    noop();
                `,
                options
            );

            const expected = createSourceFile(
                `
                    import { noop } from "./${input.getBaseNameWithoutExtension()}";

                    noop();
                `,
                options
            );

            // Act
            const result = await namedExportsOnly(input);

            // Assert
            expect(referencingFile).toMatchSourceFile(expected);
            await result.file.save();
        });
    });
});
