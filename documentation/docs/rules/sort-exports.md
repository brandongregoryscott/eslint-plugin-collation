# Sort Exports

## Name

`sort-exports`

## Description

Sorts specifiers in an export statement

## Example

```tsx
const foo = 5;
const bar = 4;
export { foo, bar };
```

will be transformed to:

```tsx
const foo = 5;
const bar = 4;
export { bar, foo };
```

## Notes

Comments move with their associated specifiers when sorting. Standalone comments belong to the following specifier; same-line trailing comments stay with the preceding specifier.
