# No Destructured Parameter

## Name

`no-destructured-parameter`

## Description

Require named parameters in every function and method signature. Move object and array destructuring into the function body so signatures expose the inputs without embedding their implementation details.

```ts
// Incorrect
function findAll({ page, sort }: FindAllOptions) {
    return store.findAll(page, sort);
}

// Correct
function findAll(options: FindAllOptions) {
    const { page, sort } = options;
    return store.findAll(page, sort);
}
```

The rule checks every parameter, including callbacks, arrow functions, function expressions and declarations, class and object methods, setters, and constructors. It reports object and array patterns, including patterns inside defaulted or rest parameters.

TypeScript declarations, overloads, function and constructor types, interface methods, and call/construct signatures are also checked. Signatures without a body must use named parameters; destructuring belongs in the implementation.

```ts
// Incorrect
items.map(({ id }) => id);
type Find = ({ id }: Options) => string;

// Correct
items.map((item) => {
    const { id } = item;
    return id;
});
type Find = (options: Options) => string;
```

The rule allows ordinary property access and local destructuring. It does not require destructuring when the implementation does not need it.

## Automatic fixes

`--fix` moves patterns into the beginning of ordinary synchronous function bodies. Expression-bodied arrows become blocks returning the original expression. Existing type annotations, aliases, nested patterns, comments, rest parameters, and directive prologues are preserved. Generated names (`parameter`, `parameter2`, etc.) avoid existing identifiers, including references in nested functions. Bindings written to later use `let` instead of `const`.

Multiple destructured parameters are rewritten together, with declarations kept in parameter order. Fix output may need formatting.

```ts
// Automatically fixed
const combine = ({ first }: Options, [second]: string[]) => first + second;

// Result (after formatting)
const combine = (parameter: Options, parameter2: string[]) => {
    const { first } = parameter;
    const [second] = parameter2;
    return first + second;
};
```

Some cases receive diagnostics without an automatic fix:

-   Default expressions or computed parameter keys can change evaluation order and scope when moved into the body. This includes a later parameter initializer that refers to an earlier destructured binding.
-   Async functions and generators can change when a destructuring error is thrown.
-   Constructors can change the ordering of destructuring relative to instance field initialization.
-   `arguments`, `eval`, or redeclared parameter bindings require a manual rewrite to preserve scope and argument behavior.
-   Optional patterns, constructor parameter properties, and signatures without bodies require manual editing.

These cases remain prohibited by the rule; the absence of a fix does not exempt them.

## Configuration

```json
{
    "collation/no-destructured-parameter": "error"
}
```

The rule has no options and is opt-in. It is not added to the recommended or strict presets.

This rule covers React components as well as other functions. Use it instead of [no-destructured-props-parameter](./no-destructured-props-parameter.md) when the convention should apply everywhere; enabling both can produce duplicate diagnostics. The React-specific rule keeps its existing behavior for projects that only want the component convention.
