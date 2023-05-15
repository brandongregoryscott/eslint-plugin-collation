# Default Export Matches Filename

## Name

`default-export-matches-filename`

## Description

Enforce default export matches the filename

## Example

Example of _incorrect_ code for this rule:

```tsx
// Avatar.tsx
const Icon = () => <div></div>;

export default Icon;
```

This rule will automatically change `Icon` to `Avatar` to match the filename:

```tsx
// Avatar.tsx
const Avatar = () => <div></div>;

export default Avatar;
```

Example of _correct_ code for this rule:

```tsx
// Filename is one of the following: StringUtils.ts, stringUtils.ts, string-utils.ts, string_utils.ts
const StringUtils = {
    isEmpty: () => {},
};

export default StringUtils;
```

## Notes

The auto-fix for the rule will try to match the case of the filename when it can be detected and safely used as an identifier, e.g. `camelCase`, `TitleCase` or `CONSTANT_CASE`. Otherwise, the identifier will be replaced with a `camelCase` version of the filename.

Since there are a number of different cases to use for filenames and exports, the rule is intentionally lenient and will match on any case. If you'd like to see a more advanced configuration option for filename <> export matching, please [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!
