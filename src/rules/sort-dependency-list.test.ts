import { codeBlock } from "common-tags";
import { RuleTester } from "../test/test-utils";
import { sortDependencyList } from "./sort-dependency-list";
import tsEslint from "typescript-eslint";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("sortDependencyList", sortDependencyList, {
    valid: [
        {
            name: "accepts sorted dependencies containing comments",
            code: codeBlock`
                useEffect(() => {}, [a, /* keep */ b])
            `,
        },

        {
            name: "should not report errors for useEffect without dependency list",
            code: codeBlock`
                useEffect(() => {})
            `,
        },
        {
            name: "should not report errors for useEffect with empty dependency list",
            code: codeBlock`
                useEffect(() => {}, [])
            `,
        },
        {
            name: "should not report errors for useEffect with single element dependency list",
            code: codeBlock`
                useEffect(() => {}, [isLoading])
            `,
        },
        {
            name: "should not report errors for useMemo without dependency list",
            code: codeBlock`
                useMemo(() => {})
            `,
        },
        {
            name: "should not report errors for useMemo with empty dependency list",
            code: codeBlock`
                useMemo(() => {}, [])
            `,
        },
        {
            name: "should not report errors for useMemo with single element dependency list",
            code: codeBlock`
                useMemo(() => {}, [isLoading])
            `,
        },
        {
            name: "should not report errors for useCallback without dependency list",
            code: codeBlock`
                useCallback(() => {})
            `,
        },
        {
            name: "should not report errors for useCallback with empty dependency list",
            code: codeBlock`
                useCallback(() => {}, [])
            `,
        },
        {
            name: "should not report errors for useCallback with single element dependency list",
            code: codeBlock`
                useCallback(() => {}, [isLoading])
            `,
        },
        {
            name: "should not report errors for useEffect with sorted dependency list",
            code: codeBlock`
                useEffect(() => {}, [hasValues, isLoading])
            `,
        },
        {
            name: "should not report errors for useMemo with sorted dependency list",
            code: codeBlock`
                useMemo(() => {}, [hasValues, isLoading])
            `,
        },
        {
            name: "should not report errors for useCallback with sorted dependency list",
            code: codeBlock`
                useCallback(() => {}, [hasValues, isLoading])
            `,
        },
        {
            // See: https://github.com/brandongregoryscott/eslint-plugin-collation/issues/52#issuecomment-1151937166
            name: "should not crash on sparse array",
            code: codeBlock`
                useEffect(redirectUnauthenticatedUser, [,user])
            `,
        },
    ],
    invalid: [
        {
            name: "moves trailing line comments after commas with dependencies",
            code: codeBlock`
                useEffect(() => {}, [b, // b docs
                    a])
            `,
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    b, // b docs
                ])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "places commas before trailing line comments originally before commas",
            code: codeBlock`
                useEffect(() => {}, [b // b docs
                , a])
            `,
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    b, // b docs
                ])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "preserves comments inside member expressions",
            code: codeBlock`
                useEffect(() => {}, [z.value, a./* keep */value])
            `,
            output: codeBlock`
                useEffect(() => {}, [a./* keep */value, z.value])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves consecutive leading comments as a group",
            code: codeBlock`
                useEffect(() => {}, [
                    // b docs
                    /* more b docs */
                    b,
                    a,
                ])
            `,
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    // b docs
                    /* more b docs */
                    b,
                ])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "sorts dependencies while preserving comments outside the list",
            code: codeBlock`
                // before
                useEffect(() => { /* keep */ }, [b, a]) // after
            `,
            output: codeBlock`
                // before
                useEffect(() => { /* keep */ }, [a, b]) // after
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },

        {
            name: "moves leading block comments with dependencies",
            code: codeBlock`
                useEffect(() => {}, [b, /* keep */ a])
            `,
            output: codeBlock`
                useEffect(() => {}, [/* keep */ a, b])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves commented out dependencies from issue 66 with the following node",
            code: codeBlock`
                useMemo(() => {}, [b,
                    // JSON.stringify(mapping),
                    a])
            `,
            output: codeBlock`
                useMemo(() => {}, [
                    // JSON.stringify(mapping),
                    a,
                    b,
                ])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves trailing comments with dependencies",
            code: codeBlock`
                useCallback(() => {}, [b, a /* trailing */])
            `,
            output: codeBlock`
                useCallback(() => {}, [a /* trailing */, b])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list",
            code: codeBlock`
                useEffect(() => {}, [c, b, a])
            `,
            output: codeBlock`
                useEffect(() => {}, [a, b, c])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list with nested property access",
            code: codeBlock`
                useEffect(() => {}, [setProject, handleOpenDialog, project.name])
            `,
            output: codeBlock`
                useEffect(() => {}, [handleOpenDialog, project.name, setProject])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list with deeply nested property access",
            code: codeBlock`
                useEffect(() => {}, [theme.colors.gray900, setProject])
            `,
            output: codeBlock`
                useEffect(() => {}, [setProject, theme.colors.gray900])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should properly sort identifiers with same starting property access value",
            code: codeBlock`
                useEffect(() => {}, [theme.colors.gray900, theme.border.default])
            `,
            output: codeBlock`
                useEffect(() => {}, [theme.border.default, theme.colors.gray900])
            `,
            errors: [{ messageId: "sortDependencyList" }],
        },
    ],
});
