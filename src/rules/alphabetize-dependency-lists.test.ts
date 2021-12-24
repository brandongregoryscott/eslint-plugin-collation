import { Project } from "ts-morph";
import { expectSourceFilesToMatch } from "../test/matchers";
import { alphabetizeDependencyLists } from "./alphabetize-dependency-lists";

describe("alphabetizeDependencyLists", () => {
    it.each(["useCallback", "useEffect", "useMemo"])(
        "should alphabetize variables in %p dependency list",
        async (functionName: string) => {
            // Arrange
            const project = new Project({ useInMemoryFileSystem: true });
            const input = project.createSourceFile(
                "input.tsx",
                `
                const value = ${functionName}(() => {

                }, [setProject, handleOpenDialog, isLoading])
            `
            );

            const expected = project.createSourceFile(
                "expected.tsx",
                `
                const value = ${functionName}(() => {

                }, [handleOpenDialog, isLoading, setProject])
            `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expectSourceFilesToMatch(result.file, expected);
        }
    );

    it.each(["useCallback", "useEffect", "useMemo"])(
        "should not change %p calls that don't have a second argument",
        async (functionName: string) => {
            // Arrange
            const project = new Project({ useInMemoryFileSystem: true });
            const input = project.createSourceFile(
                "input.tsx",
                `
                const value = ${functionName}(() => {

                })
            `
            );

            const expected = project.createSourceFile(
                "expected.tsx",
                `
                const value = ${functionName}(() => {

                })
            `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expectSourceFilesToMatch(result.file, expected);
        }
    );

    it.each(["useCallback", "useEffect", "useMemo"])(
        "should not change %p calls that don't have an ArrayLiteralExpression as second argument",
        async (functionName: string) => {
            // Arrange
            const project = new Project({ useInMemoryFileSystem: true });
            const input = project.createSourceFile(
                "input.tsx",
                `
                    const value = ${functionName}(() => {

                    }, "something")
                `
            );

            const expected = project.createSourceFile(
                "expected.tsx",
                `
                    const value = ${functionName}(() => {

                    }, "something")
                `
            );

            // Act
            const result = await alphabetizeDependencyLists(input);

            // Assert
            expectSourceFilesToMatch(result.file, expected);
        }
    );
});
