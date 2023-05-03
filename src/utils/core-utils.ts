/**
 * Simple utility for deeply cloning complex object/arrays
 * Obviously, this should not be used for objects that can contain properties that can't be serialized
 */
const cloneDeepJson = <T extends Record<number | string, unknown> | unknown[]>(
    value: T
): T => JSON.parse(JSON.stringify(value));

/**
 * Simple utility for checking complex object/array equality using JSON.stringify
 * Obviously, this should not be used for objects that can contain properties that can't be serialized
 */
const isEqualJson = <T>(left: T, right: T): boolean =>
    JSON.stringify(left) === JSON.stringify(right);

const isEmpty = <
    T extends Record<number | string, unknown> | unknown[] | string
>(
    value: T | null | undefined
): value is null | undefined => {
    if (value == null) {
        return true;
    }

    if (typeof value === "string") {
        return value.trim().length < 1;
    }

    if (Array.isArray(value)) {
        return value.length < 1;
    }

    return Object.keys(value).length < 1;
};

export { cloneDeepJson, isEmpty, isEqualJson };
