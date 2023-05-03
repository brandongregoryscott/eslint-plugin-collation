const arrify = <T>(value: T | T[]): T[] =>
    Array.isArray(value) ? value : [value];

const flatten = <T>(values: T[][]): T[] => {
    const flattened: T[] = [];
    values.forEach((value) => {
        flattened.push(...value);
    });

    return flattened;
};

const first = <T>(value: T[] | null | undefined): T | undefined =>
    value == null ? undefined : value[0];

/**
 * Returns the first element if there's only one item in the collection
 */
const firstIfOnly = <T>(value: T[]): T | undefined =>
    value.length === 1 ? value[0] : undefined;

const intersection = <T>(left: T[], right: T[]): T[] =>
    left.filter((leftValue) => right.includes(leftValue));

const difference = <T>(left: T[], right: T[]): T[] =>
    left.filter((leftValue) => !right.includes(leftValue));

const last = <T>(value: T[] | null | undefined): T | undefined =>
    value == null ? undefined : value[value.length - 1];

export { arrify, difference, first, firstIfOnly, flatten, intersection, last };
