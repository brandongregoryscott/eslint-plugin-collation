import { Node, SourceFile } from "ts-morph";
import * as tags from "common-tags";
import { RuleResult } from "../interfaces/rule-result";

interface MatcherResult {
    message: () => string;
    pass: boolean;
}

const toHaveErrors = (result: RuleResult): MatcherResult => {
    const { errors } = result;
    const pass = errors != null && errors.length > 0;
    const condition = pass ? "not to have" : "to have";
    const formattedErrors = pass
        ? `\n\n${errors.map((error) => error.format()).join("\n")}`
        : JSON.stringify(errors);
    return {
        message: () =>
            `Expected result ${condition} errors, but received: ${formattedErrors}`,
        pass,
    };
};

const toMatchSourceFile = (
    resultOrSourceFile: RuleResult | SourceFile,
    expected: SourceFile
): MatcherResult => {
    const file =
        resultOrSourceFile instanceof SourceFile
            ? resultOrSourceFile
            : resultOrSourceFile.file;
    const resultText = tags.oneLine(file.getText());
    const expectedText = tags.oneLine(expected.getText());

    try {
        expect(resultText).toStrictEqual(expectedText);
        return { message: () => "", pass: true };
    } catch (error) {
        return { message: () => (error as Error).message, pass: false };
    }
};

export { toHaveErrors, toMatchSourceFile };
