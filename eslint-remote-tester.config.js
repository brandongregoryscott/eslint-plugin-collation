const {
    getRepositories,
    getPathIgnorePattern,
} = require("eslint-remote-tester-repositories");

/** @type {import('eslint-remote-tester').Config} */
module.exports = {
    eslintrc: {
        extends: ["plugin:collation/recommended"],
        parser: "@typescript-eslint/parser",
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
        plugins: ["collation"],
        root: true,
    },
    extensions: ["js", "jsx", "ts", "tsx"],
    pathIgnorePattern: getPathIgnorePattern(),
    repositories: getRepositories({
        randomize: true,
    }),
    // 4 hours
    timeLimit: 4 * 60 * 60,
};
