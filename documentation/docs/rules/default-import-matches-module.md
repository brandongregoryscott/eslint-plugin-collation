# Default Import Matches Module

## Name

`default-import-matches-module`

## Description

Enforce default import matches the module specifier

## Example

Example of _incorrect_ code for this rule:

```tsx
import Icon from "../Avatar";
```

This rule will automatically change `Icon` to `Avatar` to match the module specifier:

```tsx
import Avatar from "../Avatar";
```

Example of _correct_ code for this rule:

```tsx
import List from "components/list";
import * as utils from "./utils";
import { default as Avatar } from "./Avatar";
```

## Notes

The auto-fix for the rule will try to match the case of the the original identifier when it can be detected and safely used as an identifier, e.g. `camelCase`, `TitleCase` or `CONSTANT_CASE`. Otherwise, the identifier will be replaced with a `camelCase` version of the module specifier.

Since there are a number of different cases to use for modules and imports, the rule is intentionally lenient and will match on any case. If you'd like to see a more advanced configuration option for module specifier <> import matching, please [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!
