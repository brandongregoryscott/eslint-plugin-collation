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
