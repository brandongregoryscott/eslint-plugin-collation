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

There is no automatic fix because moving destructuring out of a parameter can change default-parameter evaluation and variable scope. Move the destructuring explicitly, preserving any defaults and type annotations.

## Configuration

```json
{
    "collation/no-destructured-props-parameter": "error"
}
```

The rule has no options and is opt-in.
