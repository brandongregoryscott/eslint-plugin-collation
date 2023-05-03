import { ESLintUtils } from "@typescript-eslint/utils";
import { preferImport } from "./prefer-import";
import { codeBlock } from "common-tags";
import { TWILIO_PASTE_IMPORTS } from "../constants/twilio-paste-imports";

const ruleTester = new ESLintUtils.RuleTester({
    parser: "@typescript-eslint/parser",
});

ruleTester.run("prefer-import", preferImport, {
    valid: [
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            code: "import { Box } from '@twilio-paste/core/box'",
        },
    ],
    invalid: [
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            code: "import { Box } from '@twilio-paste/core'",
            output: `import { Box } from '@twilio-paste/core/box';
`, // This new line is not ideal, but can be cleaned up later
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            code: "import { Box, Heading } from '@twilio-paste/core'",
            output: codeBlock`
                import { Box } from '@twilio-paste/core/box';
                import { Heading } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            options: [
                {
                    lodash: {
                        importName: "*",
                        replacementModuleSpecifier: "lodash/{importName}",
                        replaceAsDefault: true,
                    },
                },
            ],
            code: "import { isEmpty } from 'lodash'",
            output: "import isEmpty from 'lodash/isEmpty';",
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "*",
                        replacementModuleSpecifier:
                            "@twilio-paste/core/{importName}",
                        transformImportName: "kebab-case",
                    },
                },
            ],
            code: "import { Box } from '@twilio-paste/core'",
            output: "import { Box } from '@twilio-paste/core/box';", // This new line is not ideal, but can be cleaned up later
            errors: [
                {
                    messageId: "preferImport",
                    data: {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
        },
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "*",
                        replacementModuleSpecifier:
                            "@twilio-paste/core/{importName}",
                        transformImportName: "kebab-case",
                    },
                },
            ],
            code: "import { Box, Heading, Paragraph } from '@twilio-paste/core'",
            output: `import { Box } from '@twilio-paste/core/box';
import { Heading } from '@twilio-paste/core/heading';
import { Paragraph } from '@twilio-paste/core/paragraph';`,
            errors: [
                {
                    messageId: "preferImportMultiple",
                    data: {
                        message:
                            "Import 'Box' from '@twilio-paste/core/box', 'Heading' from '@twilio-paste/core/heading', and 'Paragraph' from '@twilio-paste/core/paragraph'.",
                    },
                },
            ],
        },
        {
            options: [
                {
                    "@twilio-paste/core": [
                        {
                            importName: "Option",
                            replacementModuleSpecifier:
                                "@twilio-paste/core/select",
                            transformImportName: "kebab-case",
                        },
                        {
                            importName: "*",
                            replacementModuleSpecifier:
                                "@twilio-paste/core/{importName}",
                            transformImportName: "kebab-case",
                        },
                    ],
                },
            ],
            code: "import { Option } from '@twilio-paste/core'",
            output: `import { Option } from '@twilio-paste/core/select';
`, // This new line is not ideal, but can be cleaned up later
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "should support glob pattern importName",
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Modal*",
                        replacementModuleSpecifier: "@twilio-paste/core/modal",
                    },
                },
            ],
            code: "import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core'",
            output: `import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core/modal';
`, // This new line is not ideal, but can be cleaned up later
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "should support multiple importNames",
            options: [
                {
                    "@twilio-paste/core": {
                        importName: [
                            "ModalBody",
                            "ModalDialogContent",
                            "ModalDialogOverlay",
                            "ModalFooter",
                            "ModalFooterActions",
                            "ModalHeading",
                        ],
                        replacementModuleSpecifier: "@twilio-paste/core/modal",
                    },
                },
            ],
            code: "import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core'",
            output: `import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core/modal';
`, // This new line is not ideal, but can be cleaned up later
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "should support multiple importNames with replaceAsDefault true",
            options: [
                {
                    lodash: {
                        importName: "*",
                        replacementModuleSpecifier: "lodash/{importName}",
                        replaceAsDefault: true,
                    },
                },
            ],
            code: "import { isEmpty, isNil } from 'lodash'",
            output: `import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';`,
            errors: [
                {
                    messageId: "preferImportMultiple",
                    data: {
                        message:
                            "Import 'isEmpty' from 'lodash/isEmpty', and 'isNil' from 'lodash/isNil'.",
                    },
                },
            ],
        },
        {
            name: "should not produce fix overlaps with large import",
            options: [
                {
                    "@twilio-paste/core": [
                        {
                            importName: "*Date*",
                            replacementModuleSpecifier:
                                "@twilio-paste/core/date-picker",
                        },
                        {
                            importName: "Modal*",
                            replacementModuleSpecifier:
                                "@twilio-paste/core/modal",
                        },
                        {
                            importName: [
                                "TBody",
                                "THead",
                                "Table",
                                "Td",
                                "Th",
                                "Tr",
                            ],
                            replacementModuleSpecifier:
                                "@twilio-paste/core/table",
                        },
                        {
                            importName: "*",
                            replacementModuleSpecifier:
                                "@twilio-paste/core/{importName}",
                            transformImportName: "kebab-case",
                        },
                    ],
                    lodash: {
                        importName: "*",
                        replacementModuleSpecifier: "lodash/{importName}",
                        replaceAsDefault: true,
                    },
                },
            ],
            code: codeBlock`
                import React, { FC, useEffect, useState } from 'react'
                import { useQuery } from '@apollo/react-hooks'
                import { Button, TBody, THead, Table, Td, Text, Th, Tr, Truncate } from '@twilio-paste/core'
                import { EmptyState, Pane, Spinner, majorScale, useTheme } from 'evergreen-ui'
                import moment from 'moment'
                import useInfiniteScroll from 'hooks/use-infinite-scroll'
                import useRouter from 'hooks/use-router'
                import useSpace from 'hooks/use-space'
                import useWorkspace from 'hooks/use-workspace'
            `,
            output: `import React, { FC, useEffect, useState } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { TBody, THead, Table, Td, Th, Tr } from '@twilio-paste/core/table';
import { Button } from '@twilio-paste/core/button';
import { Text } from '@twilio-paste/core/text';
import { Truncate } from '@twilio-paste/core/truncate';
import { EmptyState, Pane, Spinner, majorScale, useTheme } from 'evergreen-ui'
import moment from 'moment'
import useInfiniteScroll from 'hooks/use-infinite-scroll'
import useRouter from 'hooks/use-router'
import useSpace from 'hooks/use-space'
import useWorkspace from 'hooks/use-workspace'`,
            errors: [
                {
                    messageId: "preferImportMultiple",
                    data: {
                        message:
                            "Import 'TBody, THead, Table, Td, Th, Tr' from '@twilio-paste/core/table', 'Button' from '@twilio-paste/core/button', 'Text' from '@twilio-paste/core/text', and 'Truncate' from '@twilio-paste/core/truncate'.",
                    },
                },
            ],
        },
        {
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            code: "import { Box as MyBox } from '@twilio-paste/core'",
            output: `import { Box as MyBox } from '@twilio-paste/core/box';
`,
            errors: [{ messageId: "preferImport" }],
        },

        // #region Twilio Paste Import Tests

        {
            name: "Twilio Paste Imports > Alert",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Alert, AlertProps, AlertBackgroundColors, AlertRoles, AlertTextColors, AlertVariants } from '@twilio-paste/core';
            `,
            output: `import { Alert, AlertProps, AlertBackgroundColors, AlertRoles, AlertTextColors, AlertVariants } from '@twilio-paste/core/alert';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > AlertDialog",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { AlertDialog, AlertDialogProps } from '@twilio-paste/core';
            `,
            output: `import { AlertDialog, AlertDialogProps } from '@twilio-paste/core/alert-dialog';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Anchor",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Anchor, AnchorProps, isExternalUrl, secureExternalLink } from '@twilio-paste/core';
            `,
            output: `import { Anchor, AnchorProps, isExternalUrl, secureExternalLink } from '@twilio-paste/core/anchor';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > AspectRatio",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { AspectRatio, AspectRatioProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { AspectRatio } from '@twilio-paste/core/aspect-ratio';
                import { AspectRatioProps } from '@twilio-paste/core/aspect-ratio';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Avatar",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Avatar, AvatarProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Avatar } from '@twilio-paste/core/avatar';
                import { AvatarProps } from '@twilio-paste/core/avatar';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Badge",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Badge, BadgeProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Badge } from '@twilio-paste/core/badge';
                import { BadgeProps } from '@twilio-paste/core/badge';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Box",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Box, BoxProps, StyledBox, BOX_PROPS_TO_BLOCK, getCustomElementStyles, safelySpreadBoxProps } from '@twilio-paste/core';
            `,
            output: `import { Box, BoxProps, StyledBox, BOX_PROPS_TO_BLOCK, getCustomElementStyles, safelySpreadBoxProps } from '@twilio-paste/core/box';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Breadcrumb",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Breadcrumb, BreadcrumbProps, BreadcrumbItem } from '@twilio-paste/core';
            `,
            output: `import { Breadcrumb, BreadcrumbProps, BreadcrumbItem } from '@twilio-paste/core/breadcrumb';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Button",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Button, ButtonProps, ButtonToggleStyles, DestructiveSecondaryButtonToggleStyles } from '@twilio-paste/core';
            `,
            output: `import { Button, ButtonProps, ButtonToggleStyles, DestructiveSecondaryButtonToggleStyles } from '@twilio-paste/core/button';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Callout",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Callout, CalloutProps, CalloutHeading, CalloutList, CalloutListItem, CalloutText } from '@twilio-paste/core';
            `,
            output: `import { Callout, CalloutProps, CalloutHeading, CalloutList, CalloutListItem, CalloutText } from '@twilio-paste/core/callout';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Card",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Card, CardProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Card } from '@twilio-paste/core/card';
                import { CardProps } from '@twilio-paste/core/card';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > ChatComposer",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { ChatComposer, ChatComposerProps } from '@twilio-paste/core';
            `,
            output: `import { ChatComposer, ChatComposerProps } from '@twilio-paste/core/chat-composer';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > ChatLog",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { ChatLog, ChatLogProps, ChatAttachment, ChatAttachmentDescription, ChatAttachmentLink, ChatBookend, ChatBookendItem, ChatBubble, ChatEvent, ChatLogger, ChatMessage, ChatMessageMeta, ChatMessageMetaItem, ComposerAttachmentCard, useChatLogger } from '@twilio-paste/core';
            `,
            output: `import { ChatLog, ChatLogProps, ChatAttachment, ChatAttachmentDescription, ChatAttachmentLink, ChatBookend, ChatBookendItem, ChatBubble, ChatEvent, ChatLogger, ChatMessage, ChatMessageMeta, ChatMessageMetaItem, ComposerAttachmentCard, useChatLogger } from '@twilio-paste/core/chat-log';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Checkbox",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Checkbox, CheckboxProps, CheckboxDisclaimer, CheckboxGroup } from '@twilio-paste/core';
            `,
            output: `import { Checkbox, CheckboxProps, CheckboxDisclaimer, CheckboxGroup } from '@twilio-paste/core/checkbox';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > CodeBlock",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { CodeBlock, CodeBlockProps, CodeBlockHeader, CodeBlockTab, CodeBlockTabList, CodeBlockTabPanel, CodeBlockWrapper } from '@twilio-paste/core';
            `,
            output: `import { CodeBlock, CodeBlockProps, CodeBlockHeader, CodeBlockTab, CodeBlockTabList, CodeBlockTabPanel, CodeBlockWrapper } from '@twilio-paste/core/code-block';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Combobox",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Combobox, ComboboxProps, ComboboxInputWrapper, ComboboxListbox, ComboboxListboxGroup, ComboboxListboxOption, MultiselectCombobox, useCombobox } from '@twilio-paste/core';
            `,
            output: `import { Combobox, ComboboxProps, ComboboxInputWrapper, ComboboxListbox, ComboboxListboxGroup, ComboboxListboxOption, MultiselectCombobox, useCombobox } from '@twilio-paste/core/combobox';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > ComboboxPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { ComboboxPrimitive, ComboboxPrimitiveProps, useComboboxPrimitive, useMultiSelectPrimitive } from '@twilio-paste/core';
            `,
            output: `import { ComboboxPrimitive, ComboboxPrimitiveProps, useComboboxPrimitive, useMultiSelectPrimitive } from '@twilio-paste/core/combobox-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DataGrid",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DataGrid, DataGridProps, DataGridBody, DataGridCell, DataGridFoot, DataGridHead, DataGridHeader, DataGridHeaderSort, DataGridRow } from '@twilio-paste/core';
            `,
            output: `import { DataGrid, DataGridProps, DataGridBody, DataGridCell, DataGridFoot, DataGridHead, DataGridHeader, DataGridHeaderSort, DataGridRow } from '@twilio-paste/core/data-grid';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DatePicker",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DatePicker, DatePickerProps, formatReturnDate } from '@twilio-paste/core';
            `,
            output: `import { DatePicker, DatePickerProps, formatReturnDate } from '@twilio-paste/core/date-picker';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DescriptionList",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DescriptionList, DescriptionListProps, DescriptionListDetails, DescriptionListSet, DescriptionListTerm, StyledDescriptionListSet } from '@twilio-paste/core';
            `,
            output: `import { DescriptionList, DescriptionListProps, DescriptionListDetails, DescriptionListSet, DescriptionListTerm, StyledDescriptionListSet } from '@twilio-paste/core/description-list';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DetailText",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DetailText, DetailTextProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { DetailText } from '@twilio-paste/core/detail-text';
                import { DetailTextProps } from '@twilio-paste/core/detail-text';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Disclosure",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Disclosure, DisclosureProps, AnimatedDisclosureContent, DisclosureContent, DisclosureHeading, useDisclosureState } from '@twilio-paste/core';
            `,
            output: `import { Disclosure, DisclosureProps, AnimatedDisclosureContent, DisclosureContent, DisclosureHeading, useDisclosureState } from '@twilio-paste/core/disclosure';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DisclosurePrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DisclosurePrimitive, DisclosurePrimitiveProps, DisclosurePrimitiveContent, useDisclosurePrimitiveState } from '@twilio-paste/core';
            `,
            output: `import { DisclosurePrimitive, DisclosurePrimitiveProps, DisclosurePrimitiveContent, useDisclosurePrimitiveState } from '@twilio-paste/core/disclosure-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DisplayHeading",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DisplayHeading, DisplayHeadingProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { DisplayHeading } from '@twilio-paste/core/display-heading';
                import { DisplayHeadingProps } from '@twilio-paste/core/display-heading';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > DisplayPillGroup",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { DisplayPillGroup, DisplayPillGroupProps, DisplayPill } from '@twilio-paste/core';
            `,
            output: `import { DisplayPillGroup, DisplayPillGroupProps, DisplayPill } from '@twilio-paste/core/display-pill-group';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > FilePicker",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { FilePicker, FilePickerProps, FilePickerButton } from '@twilio-paste/core';
            `,
            output: `import { FilePicker, FilePickerProps, FilePickerButton } from '@twilio-paste/core/file-picker';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > FileUploader",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { FileUploader, FileUploaderProps, FileUploaderDropzone, FileUploaderDropzoneText, FileUploaderErrorText, FileUploaderHelpText, FileUploaderItem, FileUploaderItemDescription, FileUploaderItemTitle, FileUploaderItemsList, FileUploaderLabel } from '@twilio-paste/core';
            `,
            output: `import { FileUploader, FileUploaderProps, FileUploaderDropzone, FileUploaderDropzoneText, FileUploaderErrorText, FileUploaderHelpText, FileUploaderItem, FileUploaderItemDescription, FileUploaderItemTitle, FileUploaderItemsList, FileUploaderLabel } from '@twilio-paste/core/file-uploader';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Flex",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Flex, FlexProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Flex } from '@twilio-paste/core/flex';
                import { FlexProps } from '@twilio-paste/core/flex';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Form",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Form, FormProps, FormActions, FormControl, FormControlTwoColumn, FormSection, FormSectionDescription, FormSectionHeading } from '@twilio-paste/core';
            `,
            output: `import { Form, FormProps, FormActions, FormControl, FormControlTwoColumn, FormSection, FormSectionDescription, FormSectionHeading } from '@twilio-paste/core/form';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > FormPillGroup",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { FormPillGroup, FormPillGroupProps, FormPill, useFormPillState } from '@twilio-paste/core';
            `,
            output: `import { FormPillGroup, FormPillGroupProps, FormPill, useFormPillState } from '@twilio-paste/core/form-pill-group';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Grid",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Grid, GridProps, Column } from '@twilio-paste/core';
            `,
            output: `import { Grid, GridProps, Column } from '@twilio-paste/core/grid';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Heading",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Heading, HeadingProps, HeadingPropTypes } from '@twilio-paste/core';
            `,
            output: `import { Heading, HeadingProps, HeadingPropTypes } from '@twilio-paste/core/heading';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > HelpText",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { HelpText, HelpTextProps, HelpTextVariants } from '@twilio-paste/core';
            `,
            output: `import { HelpText, HelpTextProps, HelpTextVariants } from '@twilio-paste/core/help-text';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > InPageNavigation",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { InPageNavigation, InPageNavigationProps, InPageNavigationItem } from '@twilio-paste/core';
            `,
            output: `import { InPageNavigation, InPageNavigationProps, InPageNavigationItem } from '@twilio-paste/core/in-page-navigation';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > InlineCode",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { InlineCode, InlineCodeProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { InlineCode } from '@twilio-paste/core/inline-code';
                import { InlineCodeProps } from '@twilio-paste/core/inline-code';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > InlineControlGroup",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { InlineControlGroup, InlineControlGroupProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { InlineControlGroup } from '@twilio-paste/core/inline-control-group';
                import { InlineControlGroupProps } from '@twilio-paste/core/inline-control-group';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Input",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Input, InputProps, InputElement } from '@twilio-paste/core';
            `,
            output: `import { Input, InputProps, InputElement } from '@twilio-paste/core/input';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > InputBox",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { InputBox, InputBoxProps, InputChevronWrapper, Prefix, Suffix, getInputChevronIconColor } from '@twilio-paste/core';
            `,
            output: `import { InputBox, InputBoxProps, InputChevronWrapper, Prefix, Suffix, getInputChevronIconColor } from '@twilio-paste/core/input-box';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Label",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Label, LabelProps, RequiredDot } from '@twilio-paste/core';
            `,
            output: `import { Label, LabelProps, RequiredDot } from '@twilio-paste/core/label';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > List",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { List, ListProps, ListItem, OrderedList, UnorderedList } from '@twilio-paste/core';
            `,
            output: `import { List, ListProps, ListItem, OrderedList, UnorderedList } from '@twilio-paste/core/list';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > ListboxPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { ListboxPrimitive, ListboxPrimitiveProps, ListboxPrimitiveGroup, ListboxPrimitiveItem, useListboxPrimitiveState } from '@twilio-paste/core';
            `,
            output: `import { ListboxPrimitive, ListboxPrimitiveProps, ListboxPrimitiveGroup, ListboxPrimitiveItem, useListboxPrimitiveState } from '@twilio-paste/core/listbox-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > MediaObject",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { MediaObject, MediaObjectProps, MediaBody, MediaFigure } from '@twilio-paste/core';
            `,
            output: `import { MediaObject, MediaObjectProps, MediaBody, MediaFigure } from '@twilio-paste/core/media-object';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Menu",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Menu, MenuProps, MenuButton, MenuGroup, MenuGroupContext, MenuItem, MenuSeparator, StyledMenuItem, SubMenuButton, useMenuState } from '@twilio-paste/core';
            `,
            output: `import { Menu, MenuProps, MenuButton, MenuGroup, MenuGroupContext, MenuItem, MenuSeparator, StyledMenuItem, SubMenuButton, useMenuState } from '@twilio-paste/core/menu';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > MenuPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { MenuPrimitive, MenuPrimitiveProps, MenuPrimitiveButton, MenuPrimitiveGroup, MenuPrimitiveItem, MenuPrimitiveItemCheckbox, MenuPrimitiveItemRadioMenuItemRadio, MenuPrimitiveSeparator, useMenuPrimitiveState } from '@twilio-paste/core';
            `,
            output: `import { MenuPrimitive, MenuPrimitiveProps, MenuPrimitiveButton, MenuPrimitiveGroup, MenuPrimitiveItem, MenuPrimitiveItemCheckbox, MenuPrimitiveItemRadioMenuItemRadio, MenuPrimitiveSeparator, useMenuPrimitiveState } from '@twilio-paste/core/menu-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > MinimizableDialog",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { MinimizableDialog, MinimizableDialogProps, MinimizableDialogButton, MinimizableDialogContainer, MinimizableDialogContent, MinimizableDialogHeader, useMinimizableDialogState } from '@twilio-paste/core';
            `,
            output: `import { MinimizableDialog, MinimizableDialogProps, MinimizableDialogButton, MinimizableDialogContainer, MinimizableDialogContent, MinimizableDialogHeader, useMinimizableDialogState } from '@twilio-paste/core/minimizable-dialog';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Modal",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Modal, ModalProps, ModalBody, ModalContext, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading, modalBodyStyles, modalFooterStyles, modalHeaderStyles, useModalContext } from '@twilio-paste/core';
            `,
            output: `import { Modal, ModalProps, ModalBody, ModalContext, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading, modalBodyStyles, modalFooterStyles, modalHeaderStyles, useModalContext } from '@twilio-paste/core/modal';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > NonModalDialogPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { NonModalDialogPrimitive, NonModalDialogPrimitiveProps, NonModalDialogArrowPrimitive, NonModalDialogDisclosurePrimitive, useNonModalDialogPrimitiveState } from '@twilio-paste/core';
            `,
            output: `import { NonModalDialogPrimitive, NonModalDialogPrimitiveProps, NonModalDialogArrowPrimitive, NonModalDialogDisclosurePrimitive, useNonModalDialogPrimitiveState } from '@twilio-paste/core/non-modal-dialog-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Pagination",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Pagination, PaginationProps, PaginationArrow, PaginationEllipsis, PaginationItems, PaginationLabel, PaginationNumber, PaginationNumbers } from '@twilio-paste/core';
            `,
            output: `import { Pagination, PaginationProps, PaginationArrow, PaginationEllipsis, PaginationItems, PaginationLabel, PaginationNumber, PaginationNumbers } from '@twilio-paste/core/pagination';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Paragraph",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Paragraph, ParagraphProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Paragraph } from '@twilio-paste/core/paragraph';
                import { ParagraphProps } from '@twilio-paste/core/paragraph';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Popover",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Popover, PopoverProps, PopoverBadgeButton, PopoverButton, PopoverContainer, usePopoverState } from '@twilio-paste/core';
            `,
            output: `import { Popover, PopoverProps, PopoverBadgeButton, PopoverButton, PopoverContainer, usePopoverState } from '@twilio-paste/core/popover';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > RadioButtonGroup",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { RadioButtonGroup, RadioButtonGroupProps, RadioButton } from '@twilio-paste/core';
            `,
            output: `import { RadioButtonGroup, RadioButtonGroupProps, RadioButton } from '@twilio-paste/core/radio-button-group';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > RadioGroup",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { RadioGroup, RadioGroupProps, Radio } from '@twilio-paste/core';
            `,
            output: `import { RadioGroup, RadioGroupProps, Radio } from '@twilio-paste/core/radio-group';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > ScreenReaderOnly",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { ScreenReaderOnly, ScreenReaderOnlyProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { ScreenReaderOnly } from '@twilio-paste/core/screen-reader-only';
                import { ScreenReaderOnlyProps } from '@twilio-paste/core/screen-reader-only';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Select",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Select, SelectProps, Option, OptionGroup, SelectElement } from '@twilio-paste/core';
            `,
            output: `import { Select, SelectProps, Option, OptionGroup, SelectElement } from '@twilio-paste/core/select';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Separator",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Separator, SeparatorProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Separator } from '@twilio-paste/core/separator';
                import { SeparatorProps } from '@twilio-paste/core/separator';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > SiblingBox",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { SiblingBox, SiblingBoxProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { SiblingBox } from '@twilio-paste/core/sibling-box';
                import { SiblingBoxProps } from '@twilio-paste/core/sibling-box';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > SideModal",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { SideModal, SideModalProps, SideModalBody, SideModalButton, SideModalContainer, SideModalFooter, SideModalFooterActions, SideModalHeader, SideModalHeading, useSideModalState } from '@twilio-paste/core';
            `,
            output: `import { SideModal, SideModalProps, SideModalBody, SideModalButton, SideModalContainer, SideModalFooter, SideModalFooterActions, SideModalHeader, SideModalHeading, useSideModalState } from '@twilio-paste/core/side-modal';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Sidebar",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Sidebar, SidebarProps, SidebarCollapseButton, SidebarCollapseButtonWrapper, SidebarContext, SidebarHeader, SidebarOverlayContentWrapper, SidebarPushContentWrapper } from '@twilio-paste/core';
            `,
            output: `import { Sidebar, SidebarProps, SidebarCollapseButton, SidebarCollapseButtonWrapper, SidebarContext, SidebarHeader, SidebarOverlayContentWrapper, SidebarPushContentWrapper } from '@twilio-paste/core/sidebar';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > SkeletonLoader",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { SkeletonLoader, SkeletonLoaderProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { SkeletonLoader } from '@twilio-paste/core/skeleton-loader';
                import { SkeletonLoaderProps } from '@twilio-paste/core/skeleton-loader';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Spinner",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Spinner, SpinnerProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Spinner } from '@twilio-paste/core/spinner';
                import { SpinnerProps } from '@twilio-paste/core/spinner';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Stack",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Stack, StackProps, getStackChildMargins, getStackDisplay, getStackStyles } from '@twilio-paste/core';
            `,
            output: `import { Stack, StackProps, getStackChildMargins, getStackDisplay, getStackStyles } from '@twilio-paste/core/stack';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Switch",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Switch, SwitchProps, SwitchGroup } from '@twilio-paste/core';
            `,
            output: `import { Switch, SwitchProps, SwitchGroup } from '@twilio-paste/core/switch';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Table",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Table, TableProps, TBody, TBodyPropTypes, TFoot, TFootPropTypes, THead, THeadPropTypes, TablePropTypes, Td, TdPropTypes, Th, ThPropTypes, Tr, TrPropTypes } from '@twilio-paste/core';
            `,
            output: `import { Table, TableProps, TBody, TBodyPropTypes, TFoot, TFootPropTypes, THead, THeadPropTypes, TablePropTypes, Td, TdPropTypes, Th, ThPropTypes, Tr, TrPropTypes } from '@twilio-paste/core/table';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Tabs",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Tabs, TabsProps, TabList, TabPanel, TabPanels, Tab, useTabState } from '@twilio-paste/core';
            `,
            output: `import { Tabs, TabsProps, TabList, TabPanel, TabPanels, Tab, useTabState } from '@twilio-paste/core/tabs';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Text",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Text, TextProps, StyledText, TEXT_PROPS_TO_BLOCK, safelySpreadTextProps } from '@twilio-paste/core';
            `,
            output: `import { Text, TextProps, StyledText, TEXT_PROPS_TO_BLOCK, safelySpreadTextProps } from '@twilio-paste/core/text';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > TimePicker",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { TimePicker, TimePickerProps, formatReturnTime } from '@twilio-paste/core';
            `,
            output: `import { TimePicker, TimePickerProps, formatReturnTime } from '@twilio-paste/core/time-picker';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Toast",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Toast, ToastProps, AnimatedToast, ToastContainer, Toaster, useToaster } from '@twilio-paste/core';
            `,
            output: `import { Toast, ToastProps, AnimatedToast, ToastContainer, Toaster, useToaster } from '@twilio-paste/core/toast';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Tooltip",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Tooltip, TooltipProps, useTooltipState } from '@twilio-paste/core';
            `,
            output: `import { Tooltip, TooltipProps, useTooltipState } from '@twilio-paste/core/tooltip';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > TooltipPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { TooltipPrimitive, TooltipPrimitiveProps, TooltipPrimitiveArrow, TooltipPrimitiveReference, useTooltipPrimitiveState } from '@twilio-paste/core';
            `,
            output: `import { TooltipPrimitive, TooltipPrimitiveProps, TooltipPrimitiveArrow, TooltipPrimitiveReference, useTooltipPrimitiveState } from '@twilio-paste/core/tooltip-primitive';
`,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },
        {
            name: "Twilio Paste Imports > Truncate",
            options: [TWILIO_PASTE_IMPORTS],
            code: codeBlock`
                import { Truncate, TruncateProps } from '@twilio-paste/core';
            `,
            output: codeBlock`
                import { Truncate } from '@twilio-paste/core/truncate';
                import { TruncateProps } from '@twilio-paste/core/truncate';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
        },

        // #endregion Twilio Paste Import Tests
    ],
});
