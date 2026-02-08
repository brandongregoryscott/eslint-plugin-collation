# Prefer Native Private Syntax

## Name

`prefer-native-private-syntax`

## Description

Prefer native `#private` class members over TypeScript `private` modifier

## Why?

TypeScript's `private` modifier only provides compile-time privacy - the members are still accessible at runtime through JavaScript. The native `#private` syntax ([ECMAScript private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements)) provides true runtime privacy, meaning the private members cannot be accessed from outside the class even at runtime.

## Examples

### Private properties

```ts
class Foo {
    private bar = 5;
}
```

will be transformed to:

```ts
class Foo {
    #bar = 5;
}
```

### Private methods

```ts
class Foo {
    private bar() {
        return 5;
    }
}
```

will be transformed to:

```ts
class Foo {
    #bar() {
        return 5;
    }
}
```

### With modifiers

The rule handles other modifiers like `readonly`, `static`, and `async`:

```ts
class Foo {
    private readonly bar = 5;
    private static baz = 10;
    private async qux() {
        return 5;
    }
}
```

will be transformed to:

```ts
class Foo {
    readonly #bar = 5;
    static #baz = 10;
    async #qux() {
        return 5;
    }
}
```

## Notes

This rule only transforms `private` members. It does not affect `protected` members, as there is no native JavaScript equivalent for protected visibility.

When migrating existing code, be aware that references to the private member within the class (e.g., `this.bar`) will also need to be updated to use the hash syntax (e.g., `this.#bar`). This rule does not automatically update these references.

Since the `public` modifier is the default & implied behavior for class members, it is recommended to use this rule in combination with the [@typescript-eslint/explicit-member-accessibility](https://typescript-eslint.io/rules/explicit-member-accessibility) rule to automatically ban and remove any `public` modifiers:

```js
"@typescript-eslint/explicit-member-accessibility": [
    "error",
    { accessibility: "no-public" },
],
```
