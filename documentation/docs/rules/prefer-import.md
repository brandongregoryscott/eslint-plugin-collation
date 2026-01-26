# Prefer Import

## Name

`prefer-import`

## Description

Enforces imports from a preferred module over another, such as for tree-shaking purposes or wrapping a library. Similar to [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports), but with auto-fix ability.

## Options

The `options` object has the following structure:

```ts
interface PreferImportOptions {
    [moduleSpecifier: string]: ImportRule | ImportRule[];
}

interface ImportRule {
    /**
     * Import name or list of names to match and replace with preferred module imports. Can also be a wildcard ('*') to match any import from the `moduleSpecifier`, or a glob pattern ('Modal*'), using `minimatch` for pattern matching.
     */
    importName: string[] | string;

    /**
     * Import props from a module of the same canonical name, i.e. `import { AlertProps } from '@twilio-paste/core/alert'` instead of from `'@twilio-paste/core/alert-props'`
     * @default true
     */
    importPropsFromSameModule?: boolean;

    /**
     * Use a default import for replacement instead of a named import.
     * @default false
     */
    replaceAsDefault?: boolean;

    /**
     * Destination module to replace imports with. A reference to the matched import name can be used with the variable `{importName}`, e.g. 'lodash/{importName}'
     */
    replacementModuleSpecifier: string;

    /**
     * String transformation method to be run on the matched `importName`. Only applicable if `replacementModuleSpecifier` has the replacement variable `{importName}`.
     */
    transformImportName?:
        | "camel-case"
        | "kebab-case"
        | "lower-case"
        | "upper-case";
}
```

When the value of a `moduleSpecifier` is an array of `ImportRule`s (rather than a single object), they should be ordered from most specific to least specific. It's possible that an import name matches multiple `ImportRule` entries, and only the first match is used for replacement.

## Examples

### Tree shaking for `lodash` imports

Given the following ESLint config:

```json
{
    "collation/prefer-import": [
        "error",
        {
            "lodash": {
                "importName": "*",
                "replacementModuleSpecifier": "lodash/{importName}",
                "replaceAsDefault": true
            }
        }
    ]
}
```

This import:

```ts
import { isEmpty, isNil } from "lodash";
```

will be transformed to:

```ts
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
```

### Tree shaking for a component library like `@twilio-paste/core`

In addition to reducing bundle size when using `lodash` functions, one of the motivators around creating this rule was the [guidance by the Twilio Paste team on best practices](https://paste.twilio.design/core) for importing from `@twilio-paste/core`.

This plugin ([v1.3.0 or later](https://github.com/brandongregoryscott/eslint-plugin-collation/releases/tag/v1.3.0)) contains an extensive (but likely non-exhaustive) configuration list oriented around improving the developer experience while using [Twilio Paste](https://paste.twilio.design/). It should serve as a good baseline config for consuming applications. You can also view the tests that run against this config to verify expected output [here](https://github.com/brandongregoryscott/eslint-plugin-collation/blob/3f6721ebf16f688cfcf289d75936e9eff525ccec/src/rules/prefer-import.test.ts#L291-L1306).

You can enable the provided config by extending it:

```json
{
    "extends": ["plugin:collation/prefer-import.@twilio-paste"]
}
```

Alternatively, if you would like to vendorize and main this config in your own application, you can view the source [here](https://github.com/brandongregoryscott/eslint-plugin-collation/blob/main/src/constants/twilio-paste-imports.ts#L4-L272). This list has not been maintained since I left Twilio, so this might be a better option nowadays. Feel free to open up a PR if you'd like to keep this list updated.

### Enforcing a wrapped function over direct library usage

Given the following ESLint config:

```json
{
    "collation/prefer-import": [
        "error",
        {
            "lodash": {
                "importName": "isEmpty",
                "replacementModuleSpecifier": "@/collection-utils"
            }
        }
    ]
}
```

This import:

```ts
import { isEmpty } from "lodash";
```

will be transformed to:

```ts
import { isEmpty } from "@/collection-utils";
```

### Replacing global types or objects with local versions

You might want to restrict the use of certain global types and replace them with locally defined versions instead. For example, you almost never want to use the global `Text` class, but if you include the `DOM` library type definitions in your project, your IDE and TypeScript build will not flag a missing import when trying to use a `<Text />` component, but instead flag an incorrect usage of the global `Text` class.

Given the following ESLint config (note the `moduleSpecifier` is `global`):

```js
"collation/prefer-import": [
    "error",
    {
        global: [
            {
                importName: "Text",
                replacementModuleSpecifier: "@chakra-ui/react",
            },
        ],
    },
],
```

This code:

```tsx
const MutedText = () => <Text>Foo</Text>;
```

will be transformed to:

```tsx
import { Text } from "@chakra-ui/react";

const MutedText = () => <Text>Foo</Text>;
```

This should also work for type references, for example, if you have a project that has a `Node` type, and never want to reference the global `Node` class.

```js
"collation/prefer-import": [
    "error",
    {
        global: [
            {
                importName: "Node",
                replacementModuleSpecifier: "@/types",
            },
        ],
    },
],
```

This code:

```ts
type Tree = Node & {
    children?: Tree[];
};
```

will be transformed to:

```ts
import { Node } from "@/types";

type Tree = Node & {
    children?: Tree[];
};
```

## Notes

### Formatting

The fix for this rule does not handle any whitespace/formatting, and may add additional new lines (or lack new lines where may be appropriate). It's assumed you are using a more general formatting tool like `Prettier` to fix this. It shouldn't produce _broken_ code, so if the output code can't be parsed by TypeScript, please [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!

### Module Resolution

This rule does not perform any module resolution to determine if the `replacementModuleSpecifier` actually exists or not. It's up to you to ensure your configuration results in valid import paths.

### Multiple Import Declarations

When `importPropsFromSameModule` is `true` (which is the default behavior), this rule may produce multiple `ImportDeclaration` statements for the same `replacementModuleSpecifier`. Usually, imports from the same module should be consolidated into one statement (unless they are separated due to being value/type imports). The [`imports/no-duplicates`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-duplicates.md) rule can be used to auto-fix these duplicate import statements if desired.
