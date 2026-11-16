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
            code: "useEffect(() => {}, [a, /* keep */ b])",
        },

        {
            name: "should not report errors for useEffect without dependency list",
            code: "useEffect(() => {})",
        },
        {
            name: "should not report errors for useEffect with empty dependency list",
            code: "useEffect(() => {}, [])",
        },
        {
            name: "should not report errors for useEffect with single element dependency list",
            code: "useEffect(() => {}, [isLoading])",
        },
        {
            name: "should not report errors for useMemo without dependency list",
            code: "useMemo(() => {})",
        },
        {
            name: "should not report errors for useMemo with empty dependency list",
            code: "useMemo(() => {}, [])",
        },
        {
            name: "should not report errors for useMemo with single element dependency list",
            code: "useMemo(() => {}, [isLoading])",
        },
        {
            name: "should not report errors for useCallback without dependency list",
            code: "useCallback(() => {})",
        },
        {
            name: "should not report errors for useCallback with empty dependency list",
            code: "useCallback(() => {}, [])",
        },
        {
            name: "should not report errors for useCallback with single element dependency list",
            code: "useCallback(() => {}, [isLoading])",
        },
        {
            name: "should not report errors for useEffect with sorted dependency list",
            code: "useEffect(() => {}, [hasValues, isLoading])",
        },
        {
            name: "should not report errors for useMemo with sorted dependency list",
            code: "useMemo(() => {}, [hasValues, isLoading])",
        },
        {
            name: "should not report errors for useCallback with sorted dependency list",
            code: "useCallback(() => {}, [hasValues, isLoading])",
        },
        {
            // See: https://github.com/brandongregoryscott/eslint-plugin-collation/issues/52#issuecomment-1151937166
            name: "should not crash on sparse array",
            code: "useEffect(redirectUnauthenticatedUser, [,user])",
        },
    ],
    invalid: [
        {
            name: "moves trailing line comments after commas with dependencies",
            code: "useEffect(() => {}, [b, // b docs\n    a])",
            output: "useEffect(() => {}, [\n    a,\n    b, // b docs\n])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "places commas before trailing line comments originally before commas",
            code: "useEffect(() => {}, [b // b docs\n, a])",
            output: "useEffect(() => {}, [\n    a,\n    b, // b docs\n])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "preserves comments inside member expressions",
            code: "useEffect(() => {}, [z.value, a./* keep */value])",
            output: "useEffect(() => {}, [a./* keep */value, z.value])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves consecutive leading comments as a group",
            code: "useEffect(() => {}, [\n    // b docs\n    /* more b docs */\n    b,\n    a,\n])",
            output: "useEffect(() => {}, [\n    a,\n    // b docs\n    /* more b docs */\n    b,\n])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "sorts dependencies while preserving comments outside the list",
            code: "// before\nuseEffect(() => { /* keep */ }, [b, a]) // after",
            output: "// before\nuseEffect(() => { /* keep */ }, [a, b]) // after",
            errors: [{ messageId: "sortDependencyList" }],
        },

        {
            name: "moves leading block comments with dependencies",
            code: "useEffect(() => {}, [b, /* keep */ a])",
            output: "useEffect(() => {}, [/* keep */ a, b])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves commented out dependencies from issue 66 with the following node",
            code: "useMemo(() => {}, [b,\n // JSON.stringify(mapping),\n a])",
            output: "useMemo(() => {}, [\n // JSON.stringify(mapping),\n a,\n b,\n])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "moves trailing comments with dependencies",
            code: "useCallback(() => {}, [b, a /* trailing */])",
            output: "useCallback(() => {}, [a /* trailing */, b])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list",
            code: "useEffect(() => {}, [c, b, a])",
            output: "useEffect(() => {}, [a, b, c])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list with nested property access",
            code: "useEffect(() => {}, [setProject, handleOpenDialog, project.name])",
            output: "useEffect(() => {}, [handleOpenDialog, project.name, setProject])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should report errors for useEffect with unsorted dependency list with deeply nested property access",
            code: "useEffect(() => {}, [theme.colors.gray900, setProject])",
            output: "useEffect(() => {}, [setProject, theme.colors.gray900])",
            errors: [{ messageId: "sortDependencyList" }],
        },
        {
            name: "should properly sort identifiers with same starting property access value",
            code: "useEffect(() => {}, [theme.colors.gray900, theme.border.default])",
            output: "useEffect(() => {}, [theme.border.default, theme.colors.gray900])",
            errors: [{ messageId: "sortDependencyList" }],
        },
    ],
});
