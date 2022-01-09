# Alphabetize Jsx Props

## Name

`alphabetize-jsx-props`

## Description

Alphabetizes props for components/JSX elements.

## Example

```tsx
return (
    <Button onClick={() => {}} type="submit" disabled={isLoading}>
        Example
    </Button>
);
```

will be transformed to:

```tsx
return (
    <Button disabled={isLoading} onClick={() => {}} type="submit">
        Example
    </Button>
);
```

## Notes

### Spread props

Spread props (i.e. `<Button {...buttonProps}>`) will always maintain their original ordering, since moving them above or below other prop assignments can change the underlying behavior of the code. Props that appear before or after the spread assignments will still be alphabetized within their respective section.

```tsx
const Example = (props) => {
    return (
        <button
            suppress={true}
            onClick={_.noop}
            {...buttonProps}
            onBeforeInput={() => {}}
            about="test"
            disabled={true}
            {...someOtherButtonProps}
            something={true}
            readOnly={false}></button>
    );
};
```

will be transformed to:

```tsx
const Example = (props) => {
    return (
        <button
            onClick={_.noop}
            suppress={true}
            {...buttonProps}
            about="test"
            disabled={true}
            onBeforeInput={() => {}}
            {...someOtherButtonProps}
            readOnly={false}
            something={true}></button>
    );
};
```

### Nested JSX

Components that receive JSX as props will also have their props alphabetized.

```tsx
<Button
    marginY={8}
    marginRight={12}
    iconAfter={<CogIcon size={24} color="gray" />}>
    Settings
</Button>
```

will be transformed to:

```tsx
<Button
    iconAfter={<CogIcon color="gray" size={24} />}
    marginRight={12}
    marginY={8}>
    Settings
</Button>
```
