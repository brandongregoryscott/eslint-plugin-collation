# No Inline Export

## Name

`no-inline-export`

## Description

Enforces exports to appear at the end of the file

## Example

### Named exports

```ts
export const noop = () => {};
```

will be transformed to:

```ts
const noop = () => {};
export { noop };
```

### Default export

```ts
export default function noop() {}
```

will be transformed to:

```ts
function noop() {}
export default noop;
```

### Statements in between

```ts
export const noop = () => {};

const foo = () => {};

const bar = () => {};
```

will be transformed to:

```ts
const noop = () => {};

const foo = () => {};

const bar = () => {};
export { noop };
```

## Notes

In an effort to keep the fix small, this rule will generate a separate `export` statement each. For example:

```ts
export const noop = () => {};

export const foo = () => {};

export const bar = () => {};
```

will be transformed to:

```ts
const noop = () => {};

const foo = () => {};

const bar = () => {};
export { noop };
export { foo };
export { bar };
```

Since this is generally undesirable, the [`group-exports`](./group-exports) rule can be turned on to consolidate these.
