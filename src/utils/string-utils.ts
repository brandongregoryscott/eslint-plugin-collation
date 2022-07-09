import first from "lodash/first";

const getBaseFilename = (filename: string): string =>
    first(filename.split("."))!;

export { getBaseFilename };
