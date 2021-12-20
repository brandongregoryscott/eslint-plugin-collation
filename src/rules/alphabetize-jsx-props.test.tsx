import { Project } from "ts-morph";
import { alphabetizeJsxProps } from "./alphabetize-jsx-props";

describe("alphabetizeJsxProps", () => {
    it("should sort props of each JsxElement when there are unsorted props", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const component = `
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
        `;
        const expected = `
            const Example = (props) => {
                return (
                    <div onAbort={_.noop} onClick={_.noop} onWaiting={_.noop}>
                        <button disabled={true} onClick={_.noop} suppressContentEditableWarning={true}></button>
                    </div>
                );
            };
        `;
        const file = project.createSourceFile("input.tsx", component);

        // Act
        const result = alphabetizeJsxProps(file);

        // Assert
        expect(result.getFullText()).toStrictEqual(expected);
    });

    it("should sort props before and after spread assignment in JsxElement", () => {
        // Arrange
        const project = new Project({ useInMemoryFileSystem: true });
        const component = `
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
        `;
        const expected = `
            const Example = (props) => {
                return (
                    <button onClick={_.noop} suppress={true}
                        {...buttonProps} about="test" disabled={true} onBeforeInput={() => {}}
                        {...someOtherButtonProps} readOnly={false} something={true}></button>
                );
            };
        `;
        const file = project.createSourceFile("input.tsx", component);

        // Act
        const result = alphabetizeJsxProps(file);

        // Assert
        expect(result.getFullText()).toStrictEqual(expected);
    });
});
