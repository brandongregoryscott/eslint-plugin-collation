# Alphabetize Dependency Lists

## Name

`alphabetize-dependency-lists`

## Description

Alphabetizes React dependency lists.

## Example

```tsx
useEffect(() => {
    // ...business logic here
}, [setProject, handleOpenDialog, isLoading]);
```

will be transformed to:

```tsx
useEffect(() => {
    // ...business logic here
}, [handleOpenDialog, isLoading, setProject]);
```

## Notes

Dependencies that have nested property accessors (i.e. `project.name`) will be alphabetized by the first variable name.

```tsx
const value = useMemo(() => {
    // ...business logic here
}, [x, setProject, handleOpenDialog, theme.colors.gray900]);
```

will be transformed to:

```tsx
const value = useMemo(() => {
    // ...business logic here
}, [handleOpenDialog, setProject, theme.colors.gray900, x]);
```
