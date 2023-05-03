import camelCase from "lodash/camelCase";
import kebabCase from "lodash/kebabCase";

type CaseTransformation =
    | "camel-case"
    | "kebab-case"
    | "lower-case"
    | "upper-case";

const CASE_TRANSFORMATIONS: CaseTransformation[] = [
    "camel-case",
    "kebab-case",
    "lower-case",
    "upper-case",
];

const getDocsUrl = (name: string): string =>
    `https://eslint-plugin-collation.brandonscott.me/docs/rules/${name}`;

const isPattern = (value: string): boolean =>
    ["*", "{", "}", "|", "!", "(", ")", "?"].some((patternChar) =>
        value.includes(patternChar)
    );

const transformCase = (
    value: string,
    transformMethod: CaseTransformation | undefined
): string => {
    switch (transformMethod) {
        case "camel-case":
            return camelCase(value);
        case "kebab-case":
            return kebabCase(value);
        case "lower-case":
            return value.toLowerCase();
        case "upper-case":
            return value.toUpperCase();
        case undefined:
        default:
            return value;
    }
};

export type { CaseTransformation };
export { CASE_TRANSFORMATIONS, getDocsUrl, isPattern, transformCase };
