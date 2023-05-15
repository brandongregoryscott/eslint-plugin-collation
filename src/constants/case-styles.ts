import type { CaseStyle } from "../utils/string-utils";

const CASE_STYLES: CaseStyle[] = [
    "camel-case",
    "constant-case",
    "kebab-case",
    "lower-case",
    "snake-case",
    "title-case",
    "upper-case",
];

const IMPORT_EXPORT_CASE_STYLES: CaseStyle[] = [
    "camel-case",
    "title-case",
    "constant-case",
];

export { CASE_STYLES, IMPORT_EXPORT_CASE_STYLES };
