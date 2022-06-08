const last = <T>(collection: T[] | null | undefined): T | undefined =>
    collection == null ? undefined : collection[collection.length - 1];

/**
 * Creates a slice of array with `n` elements taken from the end.
 */
const takeRight = <T>(collection: T[], n: number): T[] =>
    collection.slice(0, -n);

export { last, takeRight };
