# Named Exports Only

## Name

`named-exports-only`

## Description

Converts default exports into named exports.

## Example

### EOF/export assignments

```ts
const useInput = (options?: UseInputOptions) => {
    // ...implementation
};

export default useInput;
```

will be transformed to:

```ts
const useInput = (options?: UseInputOptions) => {
    // ...implementation
};

export { useInput };
```

### Inline exports

```ts
export default function useInput(options?: UseInputOptions) {
    // ...implementation
}
```

will be transformed to:

```ts
export function useInput(options?: UseInputOptions) {
    // ...implementation
}
```
