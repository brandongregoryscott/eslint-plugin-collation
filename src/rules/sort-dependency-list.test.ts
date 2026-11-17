import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { sortDependencyList } from "./sort-dependency-list";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("sortDependencyList", sortDependencyList, {
    invalid: [
        ...[
            ["c", "b", "a"],
            ["b", "a", "c"],
            ["a", "c", "b"],
        ].map((names) => ({
            code: codeBlock`
                useEffect(() => {}, [
                    ${names.map(
                        (name) => codeBlock`
                        /* ${name} leading */ ${name}, // ${name} trailing
                    `
                    )}
                ])
            `,
            errors: [{ messageId: "sortDependencyList" as const }],
            name: `preserves leading and trailing comments for ${names.join(
                ", "
            )}`,
            output: codeBlock`
                useEffect(() => {}, [
                    /* a leading */
                    a, // a trailing
                    /* b leading */
                    b, // b trailing
                    /* c leading */
                    c, // c trailing
                ])
            `,
        })),

        {
            code: codeBlock`
                useEffect(() => {}, [b, // b docs
                    a])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "moves trailing line comments after commas with dependencies",
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    b, // b docs
                ])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [b // b docs
                , a])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "places commas before trailing line comments originally before commas",
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    b, // b docs
                ])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [z.value, a./* keep */value])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "preserves comments inside member expressions",
            output: codeBlock`
                useEffect(() => {}, [a./* keep */value, z.value])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [
                    // b docs
                    /* more b docs */
                    b,
                    a,
                ])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "moves consecutive leading comments as a group",
            output: codeBlock`
                useEffect(() => {}, [
                    a,
                    // b docs
                    /* more b docs */
                    b,
                ])
            `,
        },
        {
            code: codeBlock`
                // before
                useEffect(() => { /* keep */ }, [b, a]) // after
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "sorts dependencies while preserving comments outside the list",
            output: codeBlock`
                // before
                useEffect(() => { /* keep */ }, [a, b]) // after
            `,
        },

        {
            code: codeBlock`
                useEffect(() => {}, [b, /* keep */ a])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "moves leading block comments with dependencies",
            output: codeBlock`
                useEffect(() => {}, [/* keep */ a, b])
            `,
        },
        {
            code: codeBlock`
                useMemo(() => {}, [b,
                    // JSON.stringify(mapping),
                    a])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "moves commented out dependencies from issue 66 with the following node",
            output: codeBlock`
                useMemo(() => {}, [
                    // JSON.stringify(mapping),
                    a,
                    b,
                ])
            `,
        },
        {
            code: codeBlock`
                useCallback(() => {}, [b, a /* trailing */])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "moves trailing comments with dependencies",
            output: codeBlock`
                useCallback(() => {}, [a /* trailing */, b])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [c, b, a])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "should report errors for useEffect with unsorted dependency list",
            output: codeBlock`
                useEffect(() => {}, [a, b, c])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [setProject, handleOpenDialog, project.name])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "should report errors for useEffect with unsorted dependency list with nested property access",
            output: codeBlock`
                useEffect(() => {}, [handleOpenDialog, project.name, setProject])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [theme.colors.gray900, setProject])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "should report errors for useEffect with unsorted dependency list with deeply nested property access",
            output: codeBlock`
                useEffect(() => {}, [setProject, theme.colors.gray900])
            `,
        },
        {
            code: codeBlock`
                useEffect(() => {}, [theme.colors.gray900, theme.border.default])
            `,
            errors: [{ messageId: "sortDependencyList" }],
            name: "should properly sort identifiers with same starting property access value",
            output: codeBlock`
                useEffect(() => {}, [theme.border.default, theme.colors.gray900])
            `,
        },
    ],
    valid: [
        ...["useEffect", "useMemo", "useCallback"].flatMap((hook) =>
            [
                "z(), a()",
                "z = 1, a = 2",
                "z++, a++",
                "...z, ...a",
                "z().value, a().value",
                "z[key()], a[key()]",
                "z, a()",
            ].map((dependencies) => ({
                code: `${hook}(() => {}, [${dependencies}]);`,
                name: `skips potentially effectful dependencies in ${hook}: ${dependencies}`,
            }))
        ),

        {
            code: codeBlock`
                useEffect(() => {}, [a, /* keep */ b])
            `,
            name: "accepts sorted dependencies containing comments",
        },

        {
            code: codeBlock`
                useEffect(() => {})
            `,
            name: "should not report errors for useEffect without dependency list",
        },
        {
            code: codeBlock`
                useEffect(() => {}, [])
            `,
            name: "should not report errors for useEffect with empty dependency list",
        },
        {
            code: codeBlock`
                useEffect(() => {}, [isLoading])
            `,
            name: "should not report errors for useEffect with single element dependency list",
        },
        {
            code: codeBlock`
                useMemo(() => {})
            `,
            name: "should not report errors for useMemo without dependency list",
        },
        {
            code: codeBlock`
                useMemo(() => {}, [])
            `,
            name: "should not report errors for useMemo with empty dependency list",
        },
        {
            code: codeBlock`
                useMemo(() => {}, [isLoading])
            `,
            name: "should not report errors for useMemo with single element dependency list",
        },
        {
            code: codeBlock`
                useCallback(() => {})
            `,
            name: "should not report errors for useCallback without dependency list",
        },
        {
            code: codeBlock`
                useCallback(() => {}, [])
            `,
            name: "should not report errors for useCallback with empty dependency list",
        },
        {
            code: codeBlock`
                useCallback(() => {}, [isLoading])
            `,
            name: "should not report errors for useCallback with single element dependency list",
        },
        {
            code: codeBlock`
                useEffect(() => {}, [hasValues, isLoading])
            `,
            name: "should not report errors for useEffect with sorted dependency list",
        },
        {
            code: codeBlock`
                useMemo(() => {}, [hasValues, isLoading])
            `,
            name: "should not report errors for useMemo with sorted dependency list",
        },
        {
            code: codeBlock`
                useCallback(() => {}, [hasValues, isLoading])
            `,
            name: "should not report errors for useCallback with sorted dependency list",
        },
        {
            code: codeBlock`
                useEffect(redirectUnauthenticatedUser, [,user])
            `,
            // See: https://github.com/brandongregoryscott/eslint-plugin-collation/issues/52#issuecomment-1151937166
            name: "should not crash on sparse array",
        },
    ],
});
