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
