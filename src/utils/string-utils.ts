import camelCase from "lodash/camelCase";
import kebabCase from "lodash/kebabCase";
import { dirname, sep, basename } from "path";
import { last } from "./collection-utils";

type CaseStyle =
    | "camel-case"
    | "constant-case"
    | "kebab-case"
    | "lower-case"
    | "snake-case"
    | "title-case"
    | "upper-case";

const CASE_STYLES: CaseStyle[] = [
    "camel-case",
    "constant-case",
    "kebab-case",
    "lower-case",
    "snake-case",
    "title-case",
    "upper-case",
];

const changeCase = (
    value: string,
    caseStyle: CaseStyle | undefined
): string => {
    switch (caseStyle) {
        case "camel-case":
            return camelCase(value);
        case "constant-case":
            return constantCase(value);
        case "kebab-case":
            return kebabCase(value);
        case "lower-case":
            return value.toLowerCase();
        case "upper-case":
            return value.toUpperCase();
        case "title-case":
            return titleCase(value);
        case "snake-case":
            return snakeCase(value);
        case undefined:
        default:
            return value;
    }
};

const constantCase = (value: string): string => snakeCase(value).toUpperCase();

const getBasenameWithoutExtension = (path: string): string =>
    removeExtension(basename(path));

const getDirectoryName = (path: string): string =>
    last(dirname(path).split(sep)) ?? "";

const getDocsUrl = (name: string): string =>
    `https://eslint-plugin-collation.brandonscott.me/docs/rules/${name}`;

const isPattern = (value: string): boolean =>
    ["*", "{", "}", "|", "!", "(", ")", "?"].some((patternChar) =>
        value.includes(patternChar)
    );

const matchCase = (value: string): CaseStyle | undefined => {
    if (value === camelCase(value)) {
        return "camel-case";
    }

    if (value === constantCase(value)) {
        return "constant-case";
    }

    if (value === kebabCase(value)) {
        return "kebab-case";
    }

    if (value === titleCase(value)) {
        return "title-case";
    }

    if (value === value.toLowerCase()) {
        return "lower-case";
    }

    if (value === value.toUpperCase()) {
        return "upper-case";
    }

    if (value === snakeCase(value)) {
        return "snake-case";
    }

    return undefined;
};

const snakeCase = (value: string): string =>
    kebabCase(value).replace(/\-/g, "_");

const removeExtension = (filename: string): string =>
    filename.includes(".") ? filename.split(".")[0] : filename;

const titleCase = (value: string): string => {
    if (value.length === 0) {
        return value;
    }

    const camelCasedValue = camelCase(value).split("");
    camelCasedValue[0] = camelCasedValue[0].toUpperCase();
    return camelCasedValue.join("");
};

export type { CaseStyle };
export {
    CASE_STYLES,
    changeCase,
    getBasenameWithoutExtension,
    getDirectoryName,
    getDocsUrl,
    isPattern,
    matchCase,
    removeExtension,
};
