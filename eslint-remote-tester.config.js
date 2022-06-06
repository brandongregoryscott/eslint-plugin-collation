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
    // 30 minutes
    repositories: getRepositories({
        randomize: true,
    }),
    timeLimit: 0.5 * 60 * 60,
};
