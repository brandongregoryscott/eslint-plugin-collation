# Group Exports

## Name

`group-exports`

## Description

Consolidates multiple export statements

## Example

```ts
const foo = 5;
const bar = 4;
export { foo };
export { bar };
```

will be transformed to:

```ts
const foo = 5;
const bar = 4;

export { bar, foo };
```

### Type exports

`export type` syntax will be preserved

```ts
type Foo = number;
type Bar = string;
export type { Foo };
export type { Bar };
```

will be transformed to:

```ts
type Foo = number;
type Bar = string;

export type { Bar, Foo };
```

## Notes

The fix for this rule does not handle any whitespace/formatting, and may add additional new lines. It's assumed you are using a more general formatting tool like `Prettier` to strip away unnecessary line breaks.

For example, when there are multiple value _and_ type exports:

```ts
type Foo = number;
const foo: Foo = 5;

type Bar = string;
const bar: Bar = "bar";

export type { Foo };
export { foo };
export type { Bar };
export { bar };
```

will be transformed to:

<!-- prettier-ignore -->
```ts
type Foo = number;
const foo: Foo = 5;

type Bar = string;
const bar: Bar = "bar";



export type { Bar, Foo };
export { bar, foo };
```
