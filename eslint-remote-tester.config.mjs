import {
    getRepositories,
    getPathIgnorePattern,
} from "eslint-remote-tester-repositories";
import collation from "eslint-plugin-collation";
import parser from "@typescript-eslint/parser";

/** @type {import('eslint-remote-tester').Config} */
export default {
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
