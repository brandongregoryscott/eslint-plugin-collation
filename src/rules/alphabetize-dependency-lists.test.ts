import { Project } from "ts-morph";
import { expectSourceFilesToMatch } from "../test/matchers";
import { alphabetizeDependencyLists } from "./alphabetize-dependency-lists";

describe("alphabetizeDependencyLists", () => {
    it.only("should alphabetize variables in dependency list", async () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.tsx",
            `
                useEffect(() => {

                }, [setProject, handleOpenDialog, isLoading])
            `
        );

        const expected = project.createSourceFile(
            "expected.tsx",
            `
                useEffect(() => {

                }, [handleOpenDialog, isLoading, setProject])
            `
        );

        // Act
        const result = await alphabetizeDependencyLists(input);

        // Assert
        expectSourceFilesToMatch(result.file, expected);
    });
});
