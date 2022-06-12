const filterNot = <T>(collection: T[], predicate: (value: T) => boolean): T[] =>
    collection.filter((value) => !predicate(value));

export { filterNot };
