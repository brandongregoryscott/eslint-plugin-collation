const getValues = <TKey, TValue>(map: Map<TKey, TValue>): TValue[] => {
    const values: TValue[] = [];
    for (const [, value] of map.entries()) {
        values.push(value);
    }

    return values;
};

const iterate = <TKey, TValue>(
    map: Map<TKey, TValue>,
    iterator: (key: TKey, value: TValue) => void
) => {
    map.forEach((value, key) => iterator(key, value));
};

const updateIn = <TKey, TValue>(
    map: Map<TKey, TValue>,
    key: TKey,
    updater: (value: TValue | undefined) => TValue
): void => {
    const value = map.get(key);
    map.set(key, updater(value));
};

export { getValues, iterate, updateIn };
