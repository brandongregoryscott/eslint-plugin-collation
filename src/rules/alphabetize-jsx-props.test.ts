import { createSourceFile } from "../test/test-utils";
import { alphabetizeJsxProps } from "./alphabetize-jsx-props";

describe("alphabetizeJsxProps", () => {
    it("should sort props of each JsxElement when there are unsorted props", async () => {
        // Arrange
        const input = createSourceFile(
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
        const expected = createSourceFile(
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
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort props before and after spread assignment in JsxElement", async () => {
        // Arrange
        const input = createSourceFile(
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

        const expected = createSourceFile(
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
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort props when spread assignment is in beginning of JsxElement", async () => {
        // Arrange
        const input = createSourceFile(
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

        const expected = createSourceFile(
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
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should leave props unmodified when spread assignment is in beginning of JsxElement and there's only one named prop", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const Example = (props) => {
                    return (
                        <button
                            {...buttonProps}
                            readOnly={false}></button>
                    );
                };
            `
        );

        const expected = createSourceFile(
            `
                const Example = (props) => {
                    return (
                        <button
                            {...buttonProps}
                            readOnly={false}></button>
                    );
                };
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).not.toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort props when spread assignment is at end of JsxElement", async () => {
        // Arrange
        const input = createSourceFile(
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

        const expected = createSourceFile(
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
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should leave props unmodified when spread assignment is at end of JsxElement and there's only one named prop", async () => {
        // Arrange
        const input = createSourceFile(
            `
                const Example = (props) => {
                    return (
                        <button
                            readOnly={false}
                            {...buttonProps}></button>
                    );
                };
            `
        );

        const expected = createSourceFile(
            `
                const Example = (props) => {
                    return (
                        <button
                            readOnly={false}
                            {...buttonProps}></button>
                    );
                };
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).not.toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort props of self-closing JsxElements", async () => {
        // Arrange
        const input = createSourceFile(
            `
                <EmptyState
                    title="No Instruments Found"
                    description="Save a new instrument to begin"
                    iconBgColor={theme.colors.gray100}
                />
            `
        );

        const expected = createSourceFile(
            `
                <EmptyState
                    description="Save a new instrument to begin"
                    iconBgColor={theme.colors.gray100}
                    title="No Instruments Found"
                />
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it("should sort props of JsxElements that receive JsxElements as props", async () => {
        // Arrange
        const input = createSourceFile(
            `
                <Button marginY={8} marginRight={12} iconAfter={<CogIcon size={24} color="gray" />}>
                    Settings
                </Button>
            `
        );

        const expected = createSourceFile(
            `
                <Button iconAfter={<CogIcon color="gray" size={24} />} marginRight={12} marginY={8}>
                    Settings
                </Button>
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it.only("#25 should sort props with single-line comments", async () => {
        // Arrange
        const input = createSourceFile(
            `
                <IconButton
                    appearance="default"
                    // Don't apply className with hover style if another element is being dragged
                    className={isOtherElementDragging ? undefined : props.className}
                    backgroundColor={theme.colors.gray200}
                    onClick={onClick}
                    size="small"
                    visibility={visibility}
                />
            `
        );

        const expected = createSourceFile(
            `
                <IconButton
                    appearance="default"
                    backgroundColor={theme.colors.gray200}
                    // Don't apply className with hover style if another element is being dragged
                    className={isOtherElementDragging ? undefined : props.className}
                    onClick={onClick}
                    size="small"
                    visibility={visibility}
                />
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });

    it.skip("#25 should sort props with multi-line comments", async () => {
        // Arrange
        const input = createSourceFile(
            `
                <IconButton
                    /**
                     * Don't apply className with hover style
                     * if another element is being dragged
                     */
                    className={isOtherElementDragging ? undefined : props.className}
                    appearance="default"
                    backgroundColor={theme.colors.gray200}
                    onClick={onClick}
                    size="small"
                    visibility={visibility}
                />
            `
        );

        const expected = createSourceFile(
            `
                <IconButton
                    appearance="default"
                    backgroundColor={theme.colors.gray200}
                    /**
                     * Don't apply className with hover style
                     * if another element is being dragged
                     */
                    className={isOtherElementDragging ? undefined : props.className}
                    onClick={onClick}
                    size="small"
                    visibility={visibility}
                />
            `
        );

        // Act
        const result = await alphabetizeJsxProps(input);

        // Assert
        expect(result).toHaveErrors();
        expect(result).toMatchSourceFile(expected);
    });
});
