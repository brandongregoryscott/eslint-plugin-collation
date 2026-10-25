# No Destructured Props Parameter

## Name

`no-destructured-props-parameter`

## Description

Keep React component signatures simple by accepting a props object and destructuring it inside the component body.

```tsx
// Incorrect
const Badge = ({ children }: BadgeProps) => <span>{children}</span>;

// Correct
const Badge = (props: BadgeProps) => {
    const { children } = props;
    return <span>{children}</span>;
};
```

The rule checks the first parameter of PascalCase functions that return JSX, functions annotated with `React.FC` or `React.FunctionComponent` (including imported aliases), anonymous default exports returning JSX, and callbacks passed to React's `memo` and `forwardRef` (including imported aliases).

Object patterns with defaults, aliases, nested properties, or rest properties are reported. Ordinary callbacks and helpers, class methods, and parameters other than the props parameter are unaffected. The rule allows direct `props.name` access; it does not require destructuring when none is needed.

Detection is syntactic: untyped components returning only `null`, elements stored in variables, or calls to `createElement` are not recognized unless wrapped with `memo` or `forwardRef`. Custom higher-order components are not recognized.

## Automatic fixes and suggestions

`--fix` moves ordinary object patterns into the body when the first parameter has no default, the pattern has no defaults or computed keys, and all later parameters are plain identifiers. Type annotations, aliases, nested patterns, rest properties, comments, and directive statements are preserved. Expression-bodied arrows become blocks with a return statement. The generated props name avoids existing identifiers, and reassigned bindings use `let` instead of `const`.

```tsx
// Automatically fixed
const Badge = ({ label: title, ...rest }: BadgeProps) => (
    <span {...rest}>{title}</span>
);

// Result (after formatting)
const Badge = (props: BadgeProps) => {
    const { label: title, ...rest } = props;
    return <span {...rest}>{title}</span>;
};
```

Defaults, computed keys, and more complex later parameters receive an editor suggestion instead of an automatic fix. The suggestion preserves the parameter's default and type annotation, but requires review: moving destructuring can change evaluation order and which variables default expressions resolve to.

Some cases remain diagnostic-only: a later parameter refers to a moved binding, a binding is redeclared in the body, `arguments` or `eval` appears in the function, or the function is async or a generator. These require a manual rewrite; no potentially broken suggestion is offered. Optional object patterns also require manual editing.

Fix and suggestion output may need formatting.

## Configuration

```json
{
    "collation/no-destructured-props-parameter": "error"
}
```

The rule has no options and is opt-in.
