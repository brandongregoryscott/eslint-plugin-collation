import type { PreferImportOptions } from "../rules/prefer-import";

const TWILIO_PASTE_IMPORTS: PreferImportOptions = {
    "@twilio-paste/core": [
        {
            importName: ["AlertDialog*"],
            replacementModuleSpecifier: "@twilio-paste/core/alert-dialog",
        },
        {
            importName: ["Alert*"],
            replacementModuleSpecifier: "@twilio-paste/core/alert",
        },
        {
            importName: ["Anchor*", "isExternalUrl", "secureExternalLink"],
            replacementModuleSpecifier: "@twilio-paste/core/anchor",
        },
        {
            importName: [
                "BOX_PROPS_TO_BLOCK",
                "Box*",
                "StyledBox",
                "getCustomElementStyles",
                "safelySpreadBoxProps",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/box",
        },
        {
            importName: ["Breadcrumb*"],
            replacementModuleSpecifier: "@twilio-paste/core/breadcrumb",
        },
        {
            importName: ["ButtonGroup*"],
            replacementModuleSpecifier: "@twilio-paste/core/button-group",
        },
        {
            importName: ["Button*", "DestructiveSecondaryButtonToggleStyles"],
            replacementModuleSpecifier: "@twilio-paste/core/button",
        },
        {
            importName: ["Callout*"],
            replacementModuleSpecifier: "@twilio-paste/core/callout",
        },
        {
            importName: ["ChatComposer*"],
            replacementModuleSpecifier: "@twilio-paste/core/chat-composer",
        },
        {
            importName: ["*Chat*", "ComposerAttachmentCard"],
            replacementModuleSpecifier: "@twilio-paste/core/chat-log",
        },
        {
            importName: ["Checkbox*"],
            replacementModuleSpecifier: "@twilio-paste/core/checkbox",
        },
        {
            importName: ["CodeBlock*"],
            replacementModuleSpecifier: "@twilio-paste/core/code-block",
        },
        {
            importName: ["*ComboboxPrimitive*", "useMultiSelectPrimitive"],
            replacementModuleSpecifier: "@twilio-paste/core/combobox-primitive",
        },
        {
            importName: ["*Combobox*"],
            replacementModuleSpecifier: "@twilio-paste/core/combobox",
        },
        {
            importName: ["DataGrid*"],
            replacementModuleSpecifier: "@twilio-paste/core/data-grid",
        },
        {
            importName: ["DatePicker*", "formatReturnDate"],
            replacementModuleSpecifier: "@twilio-paste/core/date-picker",
        },
        {
            importName: ["*DescriptionList*"],
            replacementModuleSpecifier: "@twilio-paste/core/description-list",
        },
        {
            importName: ["DisclosurePrimitive*", "useDisclosurePrimitiveState"],
            replacementModuleSpecifier:
                "@twilio-paste/core/disclosure-primitive",
        },
        {
            importName: [
                "Disclosure*",
                "AnimatedDisclosureContent",
                "useDisclosureState",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/disclosure",
        },
        {
            importName: ["DisplayPill*"],
            replacementModuleSpecifier: "@twilio-paste/core/display-pill-group",
        },
        {
            importName: ["FilePicker*"],
            replacementModuleSpecifier: "@twilio-paste/core/file-picker",
        },
        {
            importName: ["FileUploader*"],
            replacementModuleSpecifier: "@twilio-paste/core/file-uploader",
        },
        {
            importName: ["*FormPill*"],
            replacementModuleSpecifier: "@twilio-paste/core/form-pill-group",
        },
        {
            importName: ["Form*"],
            replacementModuleSpecifier: "@twilio-paste/core/form",
        },
        {
            importName: ["Grid*", "Column*"],
            replacementModuleSpecifier: "@twilio-paste/core/grid",
        },
        {
            importName: ["Heading*"],
            replacementModuleSpecifier: "@twilio-paste/core/heading",
        },
        {
            importName: ["HelpText*"],
            replacementModuleSpecifier: "@twilio-paste/core/help-text",
        },
        {
            importName: ["InPageNavigation*"],
            replacementModuleSpecifier: "@twilio-paste/core/in-page-navigation",
        },
        {
            importName: [
                "InputBox*",
                "InputChevronWrapper",
                "Prefix*",
                "Suffix*",
                "getInputChevronIconColor",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/input-box",
        },
        {
            importName: ["Input*"],
            replacementModuleSpecifier: "@twilio-paste/core/input",
        },
        {
            importName: ["Label*", "RequiredDot*"],
            replacementModuleSpecifier: "@twilio-paste/core/label",
        },
        {
            importName: ["*ListboxPrimitive*"],
            replacementModuleSpecifier: "@twilio-paste/core/listbox-primitive",
        },
        {
            importName: ["List*", "OrderedList", "UnorderedList"],
            replacementModuleSpecifier: "@twilio-paste/core/list",
        },
        {
            importName: ["Media*"],
            replacementModuleSpecifier: "@twilio-paste/core/media-object",
        },
        {
            importName: ["*MenuPrimitive*"],
            replacementModuleSpecifier: "@twilio-paste/core/menu-primitive",
        },
        {
            importName: ["*Menu*"],
            replacementModuleSpecifier: "@twilio-paste/core/menu",
        },
        {
            importName: ["*MinimizableDialog*"],
            replacementModuleSpecifier: "@twilio-paste/core/minimizable-dialog",
        },
        {
            importName: ["*NonModalDialog*Primitive*"],
            replacementModuleSpecifier:
                "@twilio-paste/core/non-modal-dialog-primitive",
        },
        {
            importName: ["SideModal*", "useSideModalState"],
            replacementModuleSpecifier: "@twilio-paste/core/side-modal",
        },
        {
            importName: ["*Modal*", "modal*Styles"],
            replacementModuleSpecifier: "@twilio-paste/core/modal",
        },
        {
            importName: ["Pagination*"],
            replacementModuleSpecifier: "@twilio-paste/core/pagination",
        },
        {
            importName: ["Popover*", "usePopoverState"],
            replacementModuleSpecifier: "@twilio-paste/core/popover",
        },
        {
            importName: ["RadioButton*"],
            replacementModuleSpecifier: "@twilio-paste/core/radio-button-group",
        },
        {
            importName: ["Radio*"],
            replacementModuleSpecifier: "@twilio-paste/core/radio-group",
        },
        {
            importName: ["Select*", "Option*"],
            replacementModuleSpecifier: "@twilio-paste/core/select",
        },
        {
            importName: ["Sidebar*"],
            replacementModuleSpecifier: "@twilio-paste/core/sidebar",
        },
        {
            importName: [
                "Stack*",
                "getStackChildMargins",
                "getStackDisplay",
                "getStackStyles",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/stack",
        },
        {
            importName: ["Switch*"],
            replacementModuleSpecifier: "@twilio-paste/core/switch",
        },
        {
            importName: [
                "Table*",
                "TBody*",
                "TFoot*",
                "THead*",
                "Td*",
                "Th*",
                "Tr",
                "TrProp*",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/table",
        },
        {
            importName: ["Tab*", "useTabState"],
            replacementModuleSpecifier: "@twilio-paste/core/tabs",
        },
        {
            importName: [
                "Text*",
                "StyledText",
                "TEXT_PROPS_TO_BLOCK",
                "safelySpreadTextProps",
            ],
            replacementModuleSpecifier: "@twilio-paste/core/text",
        },
        {
            importName: ["TimePicker*", "formatReturnTime"],
            replacementModuleSpecifier: "@twilio-paste/core/time-picker",
        },
        {
            importName: ["Toast*", "AnimatedToast", "useToaster"],
            replacementModuleSpecifier: "@twilio-paste/core/toast",
        },
        {
            importName: ["TooltipPrimitive*", "useTooltipPrimitiveState"],
            replacementModuleSpecifier: "@twilio-paste/core/tooltip-primitive",
        },
        {
            importName: ["Tooltip*", "useTooltipState"],
            replacementModuleSpecifier: "@twilio-paste/core/tooltip",
        },
        {
            importName: "*",
            replacementModuleSpecifier: "@twilio-paste/core/{importName}",
            transformImportName: "kebab-case",
        },
    ],
};

export { TWILIO_PASTE_IMPORTS };
