const {
    getRepositories,
    getPathIgnorePattern,
} = require("eslint-remote-tester-repositories");
const collation = require("eslint-plugin-collation");
const parser = require("@typescript-eslint/parser");

/** @type {import('eslint-remote-tester').Config} */
module.exports = {
    eslintConfig: {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: { collation },
        rules: collation.configs.recommended.rules,
    },
    extensions: ["js", "jsx", "ts", "tsx"],
    pathIgnorePattern: getPathIgnorePattern(),
    repositories: getRepositories({
        randomize: true,
    }),
    // 4 hours
    timeLimit: 4 * 60 * 60,
};
