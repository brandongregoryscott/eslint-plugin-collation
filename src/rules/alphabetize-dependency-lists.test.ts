import { createSourceFile } from "../test/test-utils";
import { alphabetizeDependencyLists } from "./alphabetize-dependency-lists";

describe("alphabetizeDependencyLists", () => {
    it.each(["useCallback", "useEffect", "useMemo"])(
        "should alphabetize variables in %p dependency list",
        async (functionName: string) => {
            // Arrange
            const input = createSourceFile(
                `
                    const value = ${functionName}(() => {

                    }, [setProject, handleOpenDialog, isLoading])
                `
            );

            const expected = createSourceFile(
                `
                    const value = ${functionName}(() => {

                    }, [handleOpenDialog, isLoading, setProject])
                `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expect(result).toHaveErrors();
            expect(result).toMatchSourceFile(expected);
        }
    );

    it.each(["useCallback", "useEffect", "useMemo"])(
        "should not change %p calls that don't have a second argument",
        async (functionName: string) => {
            // Arrange
            const input = createSourceFile(
                `
                const value = ${functionName}(() => {

                })
            `
            );

            const expected = createSourceFile(
                `
                    const value = ${functionName}(() => {

                    })
                `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expect(result).not.toHaveErrors();
            expect(result).toMatchSourceFile(expected);
        }
    );

    it.each(["useCallback", "useEffect", "useMemo"])(
        "should not change %p calls that don't have an ArrayLiteralExpression as second argument",
        async (functionName: string) => {
            // Arrange
            const input = createSourceFile(
                `
                    const value = ${functionName}(() => {

                    }, "something")
                `
            );

            const expected = createSourceFile(
                `
                    const value = ${functionName}(() => {

                    }, "something")
                `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expect(result).not.toHaveErrors();
            expect(result).toMatchSourceFile(expected);
        }
    );

    it("should alphabetize nested property dependencies", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const value = useMemo(() => {

                }, [setProject, handleOpenDialog, name])
            `
        );

        const expected = createSourceFile(
            `
                const value = useMemo(() => {

                }, [handleOpenDialog, name, setProject])
            `
        );

        // Act
        const result = await alphabetizeDependencyLists(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should alphabetize deeply-nested property dependencies", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const value = useMemo(() => {

                }, [x, setProject, handleOpenDialog, theme.colors.gray900])
            `
        );

        const expected = createSourceFile(
            `
                const value = useMemo(() => {

                }, [handleOpenDialog, setProject, theme.colors.gray900, x])
            `
        );

        // Act
        const result = await alphabetizeDependencyLists(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should not return errors when deeply-nested property dependencies are already sorted", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const value = useMemo(() => {

                }, [handleOpenDialog, setProject, theme.colors.gray900, x])
            `
        );

        const expected = createSourceFile(
            `
                const value = useMemo(() => {

                }, [handleOpenDialog, setProject, theme.colors.gray900, x])
            `
        );

        // Act
        const result = await alphabetizeDependencyLists(input);

        // Assert
        expect(result).not.toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });
});
