function hasSameOrder<T>(
    original: readonly T[],
    sorted: readonly T[]
): boolean {
    return (
        original.length === sorted.length &&
        original.every((item, index) => item === sorted[index])
    );
}

export { hasSameOrder };
