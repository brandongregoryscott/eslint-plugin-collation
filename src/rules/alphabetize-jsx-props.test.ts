import { Project } from "ts-morph";
import { expectSourceFilesToMatch } from "../test/matchers";
import { alphabetizeJsxProps } from "./alphabetize-jsx-props";

describe("alphabetizeJsxProps", () => {
    it("should sort props of each JsxElement when there are unsorted props", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.tsx",
            `
                const Example = (props) => {
                    return (
                        <div onWaiting={_.noop} onClick={_.noop} onAbort={_.noop}>
                            <button
                                suppressContentEditableWarning={true}
                                onClick={_.noop}
                                disabled={true}></button>
                        </div>
                    );
                };
            `
        );
        const expected = project.createSourceFile(
            "expected.tsx",
            `
                const Example = (props) => {
                    return (
                        <div onAbort={_.noop} onClick={_.noop} onWaiting={_.noop}>
                            <button disabled={true} onClick={_.noop} suppressContentEditableWarning={true}></button>
                        </div>
                    );
                };
            `
        );

        // Act
        const result = alphabetizeJsxProps(input);

        // Assert
        expect(result.errors.length).toBeGreaterThan(0);
        expectSourceFilesToMatch(result.file, expected);
    });

    it("should sort props before and after spread assignment in JsxElement", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            suppress={true}
                            onClick={_.noop}
                            {...buttonProps}
                            onBeforeInput={() => {}}
                            about="test"
                            disabled={true}
                            {...someOtherButtonProps}
                            something={true}
                            readOnly={false}></button>
                    );
                };
            `
        );

        const expected = project.createSourceFile(
            "expected.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            onClick={_.noop}
                            suppress={true}
                            {...buttonProps}
                            about="test"
                            disabled={true}
                            onBeforeInput={() => {}}
                            {...someOtherButtonProps}
                            readOnly={false}
                            something={true}></button>
                    );
                };
            `
        );

        // Act
        const result = alphabetizeJsxProps(input);

        // Assert
        expect(result.errors.length).toBeGreaterThan(0);
        expectSourceFilesToMatch(result.file, expected);
    });

    it("should sort props when spread assignment is in beginning of JsxElement", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            {...buttonProps}
                            suppress={true}
                            onClick={_.noop}
                            onBeforeInput={() => {}}
                            about="test"
                            disabled={true}
                            something={true}
                            readOnly={false}></button>
                    );
                };
            `
        );

        const expected = project.createSourceFile(
            "expected.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            {...buttonProps}
                            about="test"
                            disabled={true}
                            onBeforeInput={() => {}}
                            onClick={_.noop}
                            readOnly={false}
                            something={true}
                            suppress={true}></button>
                    );
                };
            `
        );

        // Act
        const result = alphabetizeJsxProps(input);

        // Assert
        expect(result.errors.length).toBeGreaterThan(0);
        expectSourceFilesToMatch(result.file, expected);
    });

    it("should sort props when spread assignment is at end of JsxElement", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const input = project.createSourceFile(
            "input.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            suppress={true}
                            onClick={_.noop}
                            onBeforeInput={() => {}}
                            about="test"
                            disabled={true}
                            something={true}
                            readOnly={false}
                            {...buttonProps}></button>
                    );
                };
            `
        );

        const expected = project.createSourceFile(
            "expected.tsx",
            `
                const Example = (props) => {
                    return (
                        <button
                            about="test"
                            disabled={true}
                            onBeforeInput={() => {}}
                            onClick={_.noop}
                            readOnly={false}
                            something={true}
                            suppress={true}
                            {...buttonProps}></button>
                    );
                };
            `
        );

        // Act
        const result = alphabetizeJsxProps(input);

        // Assert
        expect(result.errors.length).toBeGreaterThan(0);
        expectSourceFilesToMatch(result.file, expected);
    });
});
