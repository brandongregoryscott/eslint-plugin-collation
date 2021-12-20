import { SourceFile } from "ts-morph";
import * as tags from "common-tags";

const expectSourceFilesToMatch = (result: SourceFile, expected: SourceFile) => {
    expect(tags.oneLine(result.getText())).toStrictEqual(
        tags.oneLine(expected.getText())
    );
};

export { expectSourceFilesToMatch };
