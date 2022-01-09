# Alphabetize Interfaces

## Name

`alphabetize-interfaces`

## Description

Alphabetizes properties/members in an interface.

## Example

```ts
interface Example {
    zeta?: string;
    beta: Record<string, string>;
    alpha: number;
    omicron: () => void;
}
```

will be transformed to:

```ts
interface Example {
    alpha: number;
    beta: Record<string, string>;
    omicron: () => void;
    zeta?: string;
}
```
