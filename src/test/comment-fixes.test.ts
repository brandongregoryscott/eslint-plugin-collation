import { codeBlock } from "common-tags";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { Linter } from "@typescript-eslint/utils/ts-eslint";
import tsEslint from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { groupExports } from "../rules/group-exports";
import { sortExports } from "../rules/sort-exports";
import { sortDependencyList } from "../rules/sort-dependency-list";

const linter = new Linter();
const config: FlatConfig.Config[] = [
    {
        languageOptions: { parser: tsEslint.parser },
        plugins: {
            collation: {
                rules: {
                    "group-exports": groupExports,
                    "sort-exports": sortExports,
                    "sort-dependency-list": sortDependencyList,
                },
            },
        },
        rules: {
            "collation/group-exports": "error",
            "collation/sort-exports": "error",
            "collation/sort-dependency-list": "error",
        },
    },
];

describe("comment-aware autofixes", () => {
    it("keeps comment ownership stable across grouping, sorting, and repeated fixes", () => {
        const code = codeBlock`
            export { /* z docs */ z } from "mod";
            export {
                // b docs
                b, // b detail
                /* a docs */ a
            } from "mod";
        `;
        const result = linter.verifyAndFix(code, config, {});
        expect(result.messages).toEqual([]);
        expect(result.output).toBe(codeBlock`
            export {
                /* a docs */
                a,
                // b docs
                b, // b detail
                /* z docs */
                z,
            } from "mod";
        `);
        expect(linter.verifyAndFix(result.output, config, {})).toMatchObject({
            fixed: false,
            output: result.output,
            messages: [],
        });
    });

    for (const names of [
        ["c", "b", "a"],
        ["b", "a", "c"],
        ["a", "c", "b"],
    ]) {
        it(`preserves leading and trailing comment ownership for ${names.join(
            ", "
        )}`, () => {
            const dependencies = names.map(
                (name) => codeBlock`
                /* ${name} leading */ ${name}, // ${name} trailing
            `
            );
            const code = codeBlock`
                useEffect(() => {}, [
                    ${dependencies}
                ])
            `;
            const result = linter.verifyAndFix(code, config, {});
            expect(result.messages).toEqual([]);
            expect(result.output).toBe(codeBlock`
                useEffect(() => {}, [
                    /* a leading */
                    a, // a trailing
                    /* b leading */
                    b, // b trailing
                    /* c leading */
                    c, // c trailing
                ])
            `);
            expect(linter.verifyAndFix(result.output, config, {}).fixed).toBe(
                false
            );
        });
    }
});
