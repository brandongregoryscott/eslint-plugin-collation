import { createSourceFile } from "../test/test-utils";
import { alphabetizeEnums } from "./alphabetize-enums";

describe.only("alphabetizeEnums", () => {
    it("should alphabetize explicit string-based enums by key", async () => {
        const input = createSourceFile(
            `
                enum Animals {
                    Dog = "dog",
                    Wolf = "wolf",
                    Cat = "cat",
                }
            `
        );

        const expected = createSourceFile(
            `
                enum Animals {
                    Cat = "cat",
                    Dog = "dog",
                    Wolf = "wolf",
                }
            `
        );

        const result = await alphabetizeEnums(input);

        expect(result).toMatchSourceFile(expected);
        expect(result).toHaveErrors();
    });
});
