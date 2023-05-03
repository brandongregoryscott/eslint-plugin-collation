# Prefer Import

## Name

`prefer-import`

## Description

Enforces imports from a preferred module, i.e. for wrapped library functionality or ESM-friendly packages. Similar to [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports), but with auto-fix ability.

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

## Notes

The fix for this rule does not handle any whitespace/formatting, and may add additional new lines (or lack new lines where may be appropriate). It's assumed you are using a more general formatting tool like `Prettier` to format the code in a more standard manner.

It shouldn't produce _broken_ code though, so if something isn't being parsed correctly, please [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!

### Twilio Paste

In addition to reducing bundle size when using `lodash` functions, one of the main motivators around creating this rule was the [guidance by the Twilio Paste team on best practices](https://paste.twilio.design/core) for importing from `@twilio-paste/core`. While the [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports) can be configured to nudge people against using `@twilio-paste/core`, it still requires you to update the import manually, and at the time of writing, VS Code doesn't know how to suggest imports from the individual packages in `@twilio-paste/core`, such as `@twilio-paste/core/box`.

As such, I've written an extensive (but likely non-exhaustive) configuration list oriented around improving the DX while using [Twilio Paste](https://paste.twilio.design/). It isn't bundled or exported, but should serve as a good baseline config for consuming applications.

<details>
<summary>Click to view Twilio Paste config</summary>

```json
{
    "@twilio-paste/core": [
        {
            "importName": ["AlertDialog*"],
            "replacementModuleSpecifier": "@twilio-paste/core/alert-dialog"
        },
        {
            "importName": ["Alert*"],
            "replacementModuleSpecifier": "@twilio-paste/core/alert"
        },
        {
            "importName": ["Anchor*", "isExternalUrl", "secureExternalLink"],
            "replacementModuleSpecifier": "@twilio-paste/core/anchor"
        },
        {
            "importName": [
                "BOX_PROPS_TO_BLOCK",
                "Box*",
                "StyledBox",
                "getCustomElementStyles",
                "safelySpreadBoxProps"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/box"
        },
        {
            "importName": ["Breadcrumb*"],
            "replacementModuleSpecifier": "@twilio-paste/core/breadcrumb"
        },
        {
            "importName": ["ButtonGroup*"],
            "replacementModuleSpecifier": "@twilio-paste/core/button-group"
        },
        {
            "importName": ["Button*", "DestructiveSecondaryButtonToggleStyles"],
            "replacementModuleSpecifier": "@twilio-paste/core/button"
        },
        {
            "importName": ["Callout*"],
            "replacementModuleSpecifier": "@twilio-paste/core/callout"
        },
        {
            "importName": ["ChatComposer*"],
            "replacementModuleSpecifier": "@twilio-paste/core/chat-composer"
        },
        {
            "importName": ["*Chat*", "ComposerAttachmentCard"],
            "replacementModuleSpecifier": "@twilio-paste/core/chat-log"
        },
        {
            "importName": ["Checkbox*"],
            "replacementModuleSpecifier": "@twilio-paste/core/checkbox"
        },
        {
            "importName": ["CodeBlock*"],
            "replacementModuleSpecifier": "@twilio-paste/core/code-block"
        },
        {
            "importName": ["*ComboboxPrimitive*", "useMultiSelectPrimitive"],
            "replacementModuleSpecifier": "@twilio-paste/core/combobox-primitive"
        },
        {
            "importName": ["*Combobox*"],
            "replacementModuleSpecifier": "@twilio-paste/core/combobox"
        },
        {
            "importName": ["DataGrid*"],
            "replacementModuleSpecifier": "@twilio-paste/core/data-grid"
        },
        {
            "importName": ["DatePicker*", "formatReturnDate"],
            "replacementModuleSpecifier": "@twilio-paste/core/date-picker"
        },
        {
            "importName": ["*DescriptionList*"],
            "replacementModuleSpecifier": "@twilio-paste/core/description-list"
        },
        {
            "importName": [
                "DisclosurePrimitive*",
                "useDisclosurePrimitiveState"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/disclosure-primitive"
        },
        {
            "importName": [
                "Disclosure*",
                "AnimatedDisclosureContent",
                "useDisclosureState"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/disclosure"
        },
        {
            "importName": ["DisplayPill*"],
            "replacementModuleSpecifier": "@twilio-paste/core/display-pill-group"
        },
        {
            "importName": ["FilePicker*"],
            "replacementModuleSpecifier": "@twilio-paste/core/file-picker"
        },
        {
            "importName": ["FileUploader*"],
            "replacementModuleSpecifier": "@twilio-paste/core/file-uploader"
        },
        {
            "importName": ["*FormPill*"],
            "replacementModuleSpecifier": "@twilio-paste/core/form-pill-group"
        },
        {
            "importName": ["Form*"],
            "replacementModuleSpecifier": "@twilio-paste/core/form"
        },
        {
            "importName": ["Grid*", "Column*"],
            "replacementModuleSpecifier": "@twilio-paste/core/grid"
        },
        {
            "importName": ["Heading*"],
            "replacementModuleSpecifier": "@twilio-paste/core/heading"
        },
        {
            "importName": ["HelpText*"],
            "replacementModuleSpecifier": "@twilio-paste/core/help-text"
        },
        {
            "importName": ["InPageNavigation*"],
            "replacementModuleSpecifier": "@twilio-paste/core/in-page-navigation"
        },
        {
            "importName": [
                "InputBox*",
                "InputChevronWrapper",
                "Prefix*",
                "Suffix*",
                "getInputChevronIconColor"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/input-box"
        },
        {
            "importName": ["Input*"],
            "replacementModuleSpecifier": "@twilio-paste/core/input"
        },
        {
            "importName": ["Label*", "RequiredDot*"],
            "replacementModuleSpecifier": "@twilio-paste/core/label"
        },
        {
            "importName": ["*ListboxPrimitive*"],
            "replacementModuleSpecifier": "@twilio-paste/core/listbox-primitive"
        },
        {
            "importName": ["List*", "OrderedList", "UnorderedList"],
            "replacementModuleSpecifier": "@twilio-paste/core/list"
        },
        {
            "importName": ["Media*"],
            "replacementModuleSpecifier": "@twilio-paste/core/media-object"
        },
        {
            "importName": ["*MenuPrimitive*"],
            "replacementModuleSpecifier": "@twilio-paste/core/menu-primitive"
        },
        {
            "importName": ["*Menu*"],
            "replacementModuleSpecifier": "@twilio-paste/core/menu"
        },
        {
            "importName": ["*MinimizableDialog*"],
            "replacementModuleSpecifier": "@twilio-paste/core/minimizable-dialog"
        },
        {
            "importName": ["*NonModalDialog*Primitive*"],
            "replacementModuleSpecifier": "@twilio-paste/core/non-modal-dialog-primitive"
        },
        {
            "importName": ["SideModal*", "useSideModalState"],
            "replacementModuleSpecifier": "@twilio-paste/core/side-modal"
        },
        {
            "importName": ["*Modal*", "modal*Styles"],
            "replacementModuleSpecifier": "@twilio-paste/core/modal"
        },
        {
            "importName": ["Pagination*"],
            "replacementModuleSpecifier": "@twilio-paste/core/pagination"
        },
        {
            "importName": ["Popover*", "usePopoverState"],
            "replacementModuleSpecifier": "@twilio-paste/core/popover"
        },
        {
            "importName": ["RadioButton*"],
            "replacementModuleSpecifier": "@twilio-paste/core/radio-button-group"
        },
        {
            "importName": ["Radio*"],
            "replacementModuleSpecifier": "@twilio-paste/core/radio-group"
        },
        {
            "importName": ["Select*", "Option*"],
            "replacementModuleSpecifier": "@twilio-paste/core/select"
        },
        {
            "importName": ["Sidebar*"],
            "replacementModuleSpecifier": "@twilio-paste/core/sidebar"
        },
        {
            "importName": [
                "Stack*",
                "getStackChildMargins",
                "getStackDisplay",
                "getStackStyles"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/stack"
        },
        {
            "importName": ["Switch*"],
            "replacementModuleSpecifier": "@twilio-paste/core/switch"
        },
        {
            "importName": [
                "Table*",
                "TBody*",
                "TFoot*",
                "THead*",
                "Td*",
                "Th*",
                "Tr",
                "TrProp*"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/table"
        },
        {
            "importName": ["Tab*", "useTabState"],
            "replacementModuleSpecifier": "@twilio-paste/core/tabs"
        },
        {
            "importName": [
                "Text*",
                "StyledText",
                "TEXT_PROPS_TO_BLOCK",
                "safelySpreadTextProps"
            ],
            "replacementModuleSpecifier": "@twilio-paste/core/text"
        },
        {
            "importName": ["TimePicker*", "formatReturnTime"],
            "replacementModuleSpecifier": "@twilio-paste/core/time-picker"
        },
        {
            "importName": ["Toast*", "AnimatedToast", "useToaster"],
            "replacementModuleSpecifier": "@twilio-paste/core/toast"
        },
        {
            "importName": ["TooltipPrimitive*", "useTooltipPrimitiveState"],
            "replacementModuleSpecifier": "@twilio-paste/core/tooltip-primitive"
        },
        {
            "importName": ["Tooltip*", "useTooltipState"],
            "replacementModuleSpecifier": "@twilio-paste/core/tooltip"
        },
        {
            "importName": "*",
            "replacementModuleSpecifier": "@twilio-paste/core/{importName}",
            "transformImportName": "kebab-case"
        }
    ]
}
```

</details>

---

If you encounter an import that's being fixed with a non-existent package, feel free to [open up an issue](https://github.com/brandongregoryscott/eslint-plugin-collation/issues/new/choose)!
