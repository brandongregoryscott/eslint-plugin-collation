const countBy = <T>(
    collection: T[],
    comparator: (item: T) => boolean
): number => collection.filter(comparator).length;

const filterNot = <T>(collection: T[], comparator: (item: T) => boolean) =>
    collection.filter((item) => !comparator(item));

export { countBy, filterNot };
