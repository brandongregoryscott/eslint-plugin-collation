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
        const file = project.createSourceFile("example.tsx", component);

        // Act
        const result = alphabetizeJsxProps(file);

        // Assert
        expect(result.getFullText()).toStrictEqual(expected);
    });
});
