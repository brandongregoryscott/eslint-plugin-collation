# Prefer Import

## Name

`prefer-import`

## Description

Enforces imports from a preferred module over another, such as for tree-shaking purposes or wrapping a library. Similar to [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports), but with auto-fix ability.

## Example

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
     * Import props from a module of the same canonical name, i.e. `import { AlertProps } from '@twilio-paste/core/alert';` instead of from `'@twilio-paste/core/alert-props'`
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

## Notes

### Formatting

The fix for this rule does not handle any whitespace/formatting, and may add additional new lines (or lack new lines where may be appropriate). It's assumed you are using a more general formatting tool like `Prettier` to fix this. It shouldn't produce _broken_ code, so if the output code can't be parsed by TypeScript, please [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!

### Module Resolution

This rule does not perform any module resolution to determine if the `replacementModuleSpecifier` actually exists or not. It's up to you to ensure your configuration results in valid import paths.

### Multiple Import Declarations

When `importPropsFromSameModule` is `true` (which is the default behavior), this rule may produce multiple `ImportDeclaration` statements for the same `replacementModuleSpecifier`. Usually, imports from the same module should be consolidated into one statement (unless they are separated due to being value/type imports). The [`imports/no-duplicates`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-duplicates.md) rule can be used to auto-fix these duplicate import statements if desired.

### Global types or objects

This rule can also be used to ban and replace references to global types or objects with local versions instead. For example, you might commonly run into an issue trying to use a `Text` component from your design system, but because there is already a global `Text` class in the `DOM` library TypeScript definitions, you aren't prompted to import the proper component. This is annoying - you almost never need to use the built-in `Text` class directly, and you need to provide the import for the correct component manually.

Given the following ESLint config:

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

This should also work for types, like `Node`. If you have your own custom `Node` type or interface, you might want to always use that instead of the global `Node` type.

Given the following ESLint config:

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
const getName = (node: Node): string | undefined => node.name;
```

will be transformed to:

```tsx
import { Node } from "@/types";

const getName = (node: Node): string | undefined => node.name;
```

### Twilio Paste

In addition to reducing bundle size when using `lodash` functions, one of the main motivators around creating this rule was the [guidance by the Twilio Paste team on best practices](https://paste.twilio.design/core) for importing from `@twilio-paste/core`. While the [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports) can be configured to nudge people against using `@twilio-paste/core`, it still requires you to update the import manually, and at the time of writing, VS Code doesn't know how to suggest imports from the individual packages such as `@twilio-paste/core/box`.

As such, I've written an extensive (but likely non-exhaustive) configuration list oriented around improving the DX while using [Twilio Paste](https://paste.twilio.design/). It should serve as a good baseline config for consuming applications. You can also view the tests that run against this config to verify expected output [here](https://github.com/brandongregoryscott/eslint-plugin-collation/blob/3f6721ebf16f688cfcf289d75936e9eff525ccec/src/rules/prefer-import.test.ts#L291-L1306).

As of [v1.3.0](https://github.com/brandongregoryscott/eslint-plugin-collation/releases/tag/v1.3.0), this config is bundled in the package and can be used by extending `collation/prefer-import.@twilio-paste`, i.e.

```json
{
    "extends": ["plugin:collation/prefer-import.@twilio-paste"]
}
```

---

If you encounter an import that's being fixed with a non-existent package, feel free to [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!
