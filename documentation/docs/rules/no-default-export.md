# No Default Export

## Name

`no-default-export`

## Description

Enforces exports to be named

## Example

### EOF/export assignments

```ts
const noop = () => {};

export default noop;
```

will be transformed to:

```ts
const noop = () => {};

export { noop };
```

### Inline exports

```ts
export default function noop() {}
```

will be transformed to:

```ts
export function noop() {}
```

## Notes

Comments around and inside exported declarations are preserved when converting default exports to named exports.
