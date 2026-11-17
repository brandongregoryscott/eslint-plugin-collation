import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { LODASH_IMPORTS } from "../constants/lodash-imports";
import { TWILIO_PASTE_IMPORTS } from "../constants/twilio-paste-imports";
import { RuleTester } from "../test/test-utils";
import { preferImport } from "./prefer-import";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

ruleTester.run("prefer-import", preferImport, {
    invalid: [
        ...["\n", "\r\n"].map((newline) => ({
            code: `import { /* block */ // line${newline}map } from "lodash";`,
            errors: [{ messageId: "preferImport" as const }],
            name: `preserves comment separators when converting to a default import: ${JSON.stringify(
                newline
            )}`,
            options: [
                {
                    lodash: {
                        importName: "map",
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ] as const,
            output: `/* block */ // line${newline}import map from 'lodash/map';`,
        })),

        {
            code: codeBlock`
                import type { /* docs */ Map } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "preserves type-only imports while moving comments",
            options: [
                {
                    lodash: {
                        importName: "Map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import type { /* docs */ Map } from 'lodash/map';
            `,
        },
        {
            code: codeBlock`
                import { type /* docs */ Map as MyMap } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "preserves type-only flags when replacing a named import as default",
            options: [
                {
                    lodash: {
                        importName: "Map",
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                /* docs */ import type MyMap from 'lodash/map';
            `,
        },
        {
            code: codeBlock`
                import lodash, { /* map docs */ map } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "keeps unmatched default imports with overlapping replacement rules",
            options: [
                {
                    lodash: [
                        {
                            importName: "map",
                            replacementModuleSpecifier: "lodash/map",
                        },
                        {
                            importName: "*",
                            replacementModuleSpecifier: "lodash/{importName}",
                        },
                    ],
                },
            ],
            output: codeBlock`
                import { /* map docs */ map } from 'lodash/map';
                import lodash from "lodash";
            `,
        },
        {
            code: codeBlock`
                import { /* map docs */ map, /* filter docs */ filter } from "lodash";
            `,
            errors: [{ messageId: "preferImportMultiple" }],
            name: "splits imports while retaining each specifier comment",
            options: [
                {
                    lodash: {
                        importName: "*",
                        replacementModuleSpecifier: "lodash/{importName}",
                    },
                },
            ],
            output: codeBlock`
                import { /* map docs */ map } from 'lodash/map';
                import { /* filter docs */ filter } from 'lodash/filter';
            `,
        },
        {
            code: codeBlock`
                import { /* map docs */ map /* alias docs */ as myMap /* tail */ } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "moves comments when converting an aliased specifier to a default import",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                /* map docs */ /* alias docs */ import myMap from 'lodash/map'; /* tail */
            `.concat(" "),
        },
        {
            code: codeBlock`
                import lodash, { /* map docs */ map } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "preserves an unmatched default import when all named specifiers move",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import { /* map docs */ map } from 'lodash/map';
                import lodash from "lodash";
            `,
        },
        {
            code: codeBlock`
                import { map, /* filter docs */ filter } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "keeps comments with unmatched specifiers",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import { map } from 'lodash/map';
                import { /* filter docs */ filter } from "lodash";
            `,
        },
        {
            code: codeBlock`
                import /* header */ { map } from /* source */ "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "moves comments outside the braces when replacing an entire import",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import { /* header */ map /* source */ } from 'lodash/map';
            `,
        },
        {
            code: codeBlock`
                import { map, // map docs
                    filter } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "keeps trailing line comments with a moved specifier",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import {
                    map, // map docs
                } from 'lodash/map';
                import { filter } from "lodash";
            `,
        },
        {
            code: codeBlock`
                import { /* keep */ map } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "preserves comments when replacing an entire import",
            options: [
                {
                    lodash: {
                        importName: "*",
                        replacementModuleSpecifier: "lodash/{importName}",
                    },
                },
            ],
            output: codeBlock`
                import { /* keep */ map } from 'lodash/map';
            `,
        },
        {
            code: codeBlock`
                import { map /* keep */, filter } from "lodash";
            `,
            errors: [{ messageId: "preferImport" }],
            name: "preserves comments when replacing part of an import",
            options: [
                {
                    lodash: {
                        importName: "map",
                        replacementModuleSpecifier: "lodash/map",
                    },
                },
            ],
            output: codeBlock`
                import { map /* keep */ } from 'lodash/map';
                import { filter } from "lodash";
            `,
        },

        {
            code: codeBlock`
                import { Box } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            output: `import { Box } from '@twilio-paste/core/box';
`, // This new line is not ideal, but can be cleaned up later
        },
        {
            code: codeBlock`
                import { Box, Heading } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            output: codeBlock`
                import { Box } from '@twilio-paste/core/box';
                import { Heading } from '@twilio-paste/core'
            `,
        },
        {
            code: codeBlock`
                import { isEmpty } from 'lodash'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            options: [
                {
                    lodash: {
                        importName: "*",
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/{importName}",
                    },
                },
            ],
            output: codeBlock`
                import isEmpty from 'lodash/isEmpty';
            `,
        },
        {
            code: codeBlock`
                import { Node as SomeOtherNode } from '@/types';
                const foo: Node = {}
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > aliased import from same module reports an error when the type would still resolve to global type",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Node as SomeOtherNode } from '@/types';
                import { Node } from '@/types';

                const foo: Node = {}
            `,
        },
        {
            code: codeBlock`
                const foo: Node = {}
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > type without an import reports an error",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Node } from '@/types';

                const foo: Node = {}
            `,
        },
        {
            code: codeBlock`
                import { Comment } from '@/types';
                const foo: Node = {}
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > adds additional import declaration for the same module specifier to fix global type reference",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Comment } from '@/types';
                import { Node } from '@/types';

                const foo: Node = {}
            `,
        },
        {
            code: codeBlock`
                interface DisplayNode extends Node {}
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > adds import declaration to fix global type reference in interface heritage clause",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Node } from '@/types';

                interface DisplayNode extends Node {}
            `,
        },
        {
            code: codeBlock`
                class Foo implements Node {}
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > adds import declaration to fix global type reference in class implements clause",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Node } from '@/types';

                class Foo implements Node {}
            `,
        },
        {
            code: codeBlock`
                type DisplayNode = Node & { foo: number }
            `,
            errors: [
                {
                    data: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > adds import declaration to fix global type reference",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
            output: codeBlock`
                import { Node } from '@/types';

                type DisplayNode = Node & { foo: number }
            `,
        },
        {
            code: codeBlock`
                const foo = Math.floor(0.5)
            `,
            errors: [
                {
                    data: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > flags member expression on global object without import",
            options: [
                {
                    global: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                },
            ],
            output: codeBlock`
                import { Math } from '@/utilities';

                const foo = Math.floor(0.5)
            `,
        },
        {
            code: codeBlock`
                const elem = <Text>Hello</Text>
            `,
            errors: [
                {
                    data: {
                        importName: "Text",
                        replacementModuleSpecifier: "@/components",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            languageOptions: {
                parserOptions: {
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            name: "global > flags JSX component without import",
            options: [
                {
                    global: {
                        importName: "Text",
                        replacementModuleSpecifier: "@/components",
                    },
                },
            ],
            output: [
                codeBlock`
                    import { Text } from '@/components';

                    const elem = <Text>Hello</Text>
                `,
            ],
        },
        {
            code: codeBlock`
                const elem = <Button />
            `,
            errors: [
                {
                    data: {
                        importName: "Button",
                        replacementModuleSpecifier: "@/components",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            languageOptions: {
                parserOptions: {
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            name: "global > flags self-closing JSX component without import",
            options: [
                {
                    global: {
                        importName: "Button",
                        replacementModuleSpecifier: "@/components",
                    },
                },
            ],
            output: [
                codeBlock`
                    import { Button } from '@/components';

                    const elem = <Button />
                `,
            ],
        },
        {
            code: codeBlock`
                const foo = Math.floor(0.5);
                const bar = Math.ceil(1.5)
            `,
            errors: [
                {
                    data: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                    messageId: "bannedGlobalType",
                },
                {
                    data: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > flags multiple uses of global object",
            options: [
                {
                    global: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                },
            ],
            output: codeBlock`
                import { Math } from '@/utilities';

                const foo = Math.floor(0.5);
                const bar = Math.ceil(1.5)
            `,
        },
        {
            code: codeBlock`
                const foo = Math.floor(0.5);
                const bar = Text.render()
            `,
            errors: [
                {
                    data: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                    messageId: "bannedGlobalType",
                },
                {
                    data: {
                        importName: "Text",
                        replacementModuleSpecifier: "@/components",
                    },
                    messageId: "bannedGlobalType",
                },
            ],
            name: "global > works with multiple global rules",
            options: [
                {
                    global: [
                        {
                            importName: "Math",
                            replacementModuleSpecifier: "@/utilities",
                        },
                        {
                            importName: "Text",
                            replacementModuleSpecifier: "@/components",
                        },
                    ],
                },
            ],
            output: [
                codeBlock`
                    import { Math } from '@/utilities';

                    const foo = Math.floor(0.5);
                    const bar = Text.render()
                `,
                codeBlock`
                    import { Math } from '@/utilities';
                    import { Text } from '@/components';


                    const foo = Math.floor(0.5);
                    const bar = Text.render()
                `,
            ],
        },
        {
            code: codeBlock`
                import { Box } from '@twilio-paste/core'
            `,
            errors: [
                {
                    data: {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                    messageId: "preferImport",
                },
            ],
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
            output: codeBlock`
                import { Box } from '@twilio-paste/core/box';
            `, // This new line is not ideal, but can be cleaned up later
        },
        {
            code: codeBlock`
                import { Box, Heading, Paragraph } from '@twilio-paste/core'
            `,
            errors: [
                {
                    data: {
                        message:
                            "Import 'Box' from '@twilio-paste/core/box', 'Heading' from '@twilio-paste/core/heading', and 'Paragraph' from '@twilio-paste/core/paragraph'.",
                    },
                    messageId: "preferImportMultiple",
                },
            ],
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
            output: codeBlock`
                import { Box } from '@twilio-paste/core/box';
                import { Heading } from '@twilio-paste/core/heading';
                import { Paragraph } from '@twilio-paste/core/paragraph';
            `,
        },
        {
            code: codeBlock`
                import { Option } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
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
            output: `import { Option } from '@twilio-paste/core/select';
`, // This new line is not ideal, but can be cleaned up later
        },
        {
            code: codeBlock`
                import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "should support glob pattern importName",
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Modal*",
                        replacementModuleSpecifier: "@twilio-paste/core/modal",
                    },
                },
            ],
            output: `import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core/modal';
`, // This new line is not ideal, but can be cleaned up later
        },
        {
            code: codeBlock`
                import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core'
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
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
            output: `import { ModalBody, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeading } from '@twilio-paste/core/modal';
`, // This new line is not ideal, but can be cleaned up later
        },
        {
            code: codeBlock`
                import { isEmpty, isNil } from 'lodash'
            `,
            errors: [
                {
                    data: {
                        message:
                            "Import 'isEmpty' from 'lodash/isEmpty', and 'isNil' from 'lodash/isNil'.",
                    },
                    messageId: "preferImportMultiple",
                },
            ],
            name: "should support multiple importNames with replaceAsDefault true",
            options: [
                {
                    lodash: {
                        importName: "*",
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/{importName}",
                    },
                },
            ],
            output: codeBlock`
                import isEmpty from 'lodash/isEmpty';
                import isNil from 'lodash/isNil';
            `,
        },
        {
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
            errors: [
                {
                    data: {
                        message:
                            "Import 'TBody, THead, Table, Td, Th, Tr' from '@twilio-paste/core/table', 'Button' from '@twilio-paste/core/button', 'Text' from '@twilio-paste/core/text', and 'Truncate' from '@twilio-paste/core/truncate'.",
                    },
                    messageId: "preferImportMultiple",
                },
            ],
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
                        replaceAsDefault: true,
                        replacementModuleSpecifier: "lodash/{importName}",
                    },
                },
            ],
            output: codeBlock`
                import React, { FC, useEffect, useState } from 'react'
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
                import useWorkspace from 'hooks/use-workspace'
            `,
        },
        {
            code: codeBlock`
                import { Box as MyBox } from '@twilio-paste/core'
            `,
            errors: [{ messageId: "preferImport" }],
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
            output: `import { Box as MyBox } from '@twilio-paste/core/box';
`,
        },
        {
            code: codeBlock`
                import { Paragraph as PasteParagraph, ParagraphProps as PasteParagraphProps } from '@twilio-paste/core'
            `,
            errors: [{ messageId: "preferImport" }],
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
            output: codeBlock`
                import { Paragraph as PasteParagraph } from '@twilio-paste/core/paragraph';
                import { ParagraphProps as PasteParagraphProps } from '@twilio-paste/core/paragraph';
            `,
        },
        {
            code: codeBlock`
                import { kebabCase, isEmpty as lodashIsEmpty } from "lodash";
            `,
            errors: [{ messageId: "preferImportMultiple" }],
            name: "uses alias name when named import is replaced as default",
            options: [LODASH_IMPORTS],
            output: codeBlock`
                import kebabCase from 'lodash/kebabCase';
                import lodashIsEmpty from 'lodash/isEmpty';
            `,
        },

        // #region Twilio Paste Import Tests

        {
            code: codeBlock`
                import { Alert, AlertProps, AlertBackgroundColors, AlertRoles, AlertTextColors, AlertVariants } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Alert",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Alert, AlertProps, AlertBackgroundColors, AlertRoles, AlertTextColors, AlertVariants } from '@twilio-paste/core/alert';
`,
        },
        {
            code: codeBlock`
                import { AlertDialog, AlertDialogProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > AlertDialog",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { AlertDialog, AlertDialogProps } from '@twilio-paste/core/alert-dialog';
`,
        },
        {
            code: codeBlock`
                import { Anchor, AnchorProps, isExternalUrl, secureExternalLink } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Anchor",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Anchor, AnchorProps, isExternalUrl, secureExternalLink } from '@twilio-paste/core/anchor';
`,
        },
        {
            code: codeBlock`
                import { AspectRatio, AspectRatioProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > AspectRatio",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { AspectRatio } from '@twilio-paste/core/aspect-ratio';
                import { AspectRatioProps } from '@twilio-paste/core/aspect-ratio';
            `,
        },
        {
            code: codeBlock`
                import { Avatar, AvatarProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Avatar",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Avatar, AvatarProps } from '@twilio-paste/core/avatar';
`,
        },
        {
            code: codeBlock`
                import { AvatarGroup, AvatarGroupProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > AvatarGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { AvatarGroup, AvatarGroupProps } from '@twilio-paste/core/avatar';
`,
        },
        {
            code: codeBlock`
                import { Badge, BadgeProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Badge",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Badge } from '@twilio-paste/core/badge';
                import { BadgeProps } from '@twilio-paste/core/badge';
            `,
        },
        {
            code: codeBlock`
                import { Box, BoxProps, StyledBox, BOX_PROPS_TO_BLOCK, getCustomElementStyles, safelySpreadBoxProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Box",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Box, BoxProps, StyledBox, BOX_PROPS_TO_BLOCK, getCustomElementStyles, safelySpreadBoxProps } from '@twilio-paste/core/box';
`,
        },
        {
            code: codeBlock`
                import { Breadcrumb, BreadcrumbProps, BreadcrumbItem } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Breadcrumb",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Breadcrumb, BreadcrumbProps, BreadcrumbItem } from '@twilio-paste/core/breadcrumb';
`,
        },
        {
            code: codeBlock`
                import { Button, ButtonProps, ButtonToggleStyles, DestructiveSecondaryButtonToggleStyles } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Button",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Button, ButtonProps, ButtonToggleStyles, DestructiveSecondaryButtonToggleStyles } from '@twilio-paste/core/button';
`,
        },
        {
            code: codeBlock`
                import { Callout, CalloutProps, CalloutHeading, CalloutList, CalloutListItem, CalloutText } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Callout",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Callout, CalloutProps, CalloutHeading, CalloutList, CalloutListItem, CalloutText } from '@twilio-paste/core/callout';
`,
        },
        {
            code: codeBlock`
                import { Card, CardProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Card",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Card } from '@twilio-paste/core/card';
                import { CardProps } from '@twilio-paste/core/card';
            `,
        },
        {
            code: codeBlock`
                import { ChatComposer, ChatComposerProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > ChatComposer",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { ChatComposer, ChatComposerProps } from '@twilio-paste/core/chat-composer';
`,
        },
        {
            code: codeBlock`
                import { ChatLog, ChatLogProps, ChatAttachment, ChatAttachmentDescription, ChatAttachmentLink, ChatBookend, ChatBookendItem, ChatBubble, ChatEvent, ChatLogger, ChatMessage, ChatMessageMeta, ChatMessageMetaItem, ComposerAttachmentCard, useChatLogger } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > ChatLog",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { ChatLog, ChatLogProps, ChatAttachment, ChatAttachmentDescription, ChatAttachmentLink, ChatBookend, ChatBookendItem, ChatBubble, ChatEvent, ChatLogger, ChatMessage, ChatMessageMeta, ChatMessageMetaItem, ComposerAttachmentCard, useChatLogger } from '@twilio-paste/core/chat-log';
`,
        },
        {
            code: codeBlock`
                import { Checkbox, CheckboxProps, CheckboxDisclaimer, CheckboxGroup } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Checkbox",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Checkbox, CheckboxProps, CheckboxDisclaimer, CheckboxGroup } from '@twilio-paste/core/checkbox';
`,
        },
        {
            code: codeBlock`
                import { CodeBlock, CodeBlockProps, CodeBlockHeader, CodeBlockTab, CodeBlockTabList, CodeBlockTabPanel, CodeBlockWrapper } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > CodeBlock",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { CodeBlock, CodeBlockProps, CodeBlockHeader, CodeBlockTab, CodeBlockTabList, CodeBlockTabPanel, CodeBlockWrapper } from '@twilio-paste/core/code-block';
`,
        },
        {
            code: codeBlock`
                import { Combobox, ComboboxProps, ComboboxInputWrapper, ComboboxListbox, ComboboxListboxGroup, ComboboxListboxOption, MultiselectCombobox, useCombobox } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Combobox",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Combobox, ComboboxProps, ComboboxInputWrapper, ComboboxListbox, ComboboxListboxGroup, ComboboxListboxOption, MultiselectCombobox, useCombobox } from '@twilio-paste/core/combobox';
`,
        },
        {
            code: codeBlock`
                import { ComboboxPrimitive, ComboboxPrimitiveProps, useComboboxPrimitive, useMultiSelectPrimitive } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > ComboboxPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { ComboboxPrimitive, ComboboxPrimitiveProps, useComboboxPrimitive, useMultiSelectPrimitive } from '@twilio-paste/core/combobox-primitive';
`,
        },
        {
            code: codeBlock`
                import { DataGrid, DataGridProps, DataGridBody, DataGridCell, DataGridFoot, DataGridHead, DataGridHeader, DataGridHeaderSort, DataGridRow } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DataGrid",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { DataGrid, DataGridProps, DataGridBody, DataGridCell, DataGridFoot, DataGridHead, DataGridHeader, DataGridHeaderSort, DataGridRow } from '@twilio-paste/core/data-grid';
`,
        },
        {
            code: codeBlock`
                import { DatePicker, DatePickerProps, formatReturnDate } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DatePicker",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { DatePicker, DatePickerProps, formatReturnDate } from '@twilio-paste/core/date-picker';
`,
        },
        {
            code: codeBlock`
                import { DescriptionList, DescriptionListProps, DescriptionListDetails, DescriptionListSet, DescriptionListTerm, StyledDescriptionListSet } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DescriptionList",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { DescriptionList, DescriptionListProps, DescriptionListDetails, DescriptionListSet, DescriptionListTerm, StyledDescriptionListSet } from '@twilio-paste/core/description-list';
`,
        },
        {
            code: codeBlock`
                import { DetailText, DetailTextProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DetailText",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { DetailText } from '@twilio-paste/core/detail-text';
                import { DetailTextProps } from '@twilio-paste/core/detail-text';
            `,
        },
        {
            code: codeBlock`
                import { Disclosure, DisclosureProps, AnimatedDisclosureContent, DisclosureContent, DisclosureHeading, useDisclosureState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Disclosure",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Disclosure, DisclosureProps, AnimatedDisclosureContent, DisclosureContent, DisclosureHeading, useDisclosureState } from '@twilio-paste/core/disclosure';
`,
        },
        {
            code: codeBlock`
                import { DisclosurePrimitive, DisclosurePrimitiveProps, DisclosurePrimitiveContent, useDisclosurePrimitiveState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DisclosurePrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { DisclosurePrimitive, DisclosurePrimitiveProps, DisclosurePrimitiveContent, useDisclosurePrimitiveState } from '@twilio-paste/core/disclosure-primitive';
`,
        },
        {
            code: codeBlock`
                import { DisplayHeading, DisplayHeadingProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DisplayHeading",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { DisplayHeading } from '@twilio-paste/core/display-heading';
                import { DisplayHeadingProps } from '@twilio-paste/core/display-heading';
            `,
        },
        {
            code: codeBlock`
                import { DisplayPillGroup, DisplayPillGroupProps, DisplayPill } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > DisplayPillGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { DisplayPillGroup, DisplayPillGroupProps, DisplayPill } from '@twilio-paste/core/display-pill-group';
`,
        },
        {
            code: codeBlock`
                import { FilePicker, FilePickerProps, FilePickerButton } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > FilePicker",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { FilePicker, FilePickerProps, FilePickerButton } from '@twilio-paste/core/file-picker';
`,
        },
        {
            code: codeBlock`
                import { FileUploader, FileUploaderProps, FileUploaderDropzone, FileUploaderDropzoneText, FileUploaderErrorText, FileUploaderHelpText, FileUploaderItem, FileUploaderItemDescription, FileUploaderItemTitle, FileUploaderItemsList, FileUploaderLabel } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > FileUploader",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { FileUploader, FileUploaderProps, FileUploaderDropzone, FileUploaderDropzoneText, FileUploaderErrorText, FileUploaderHelpText, FileUploaderItem, FileUploaderItemDescription, FileUploaderItemTitle, FileUploaderItemsList, FileUploaderLabel } from '@twilio-paste/core/file-uploader';
`,
        },
        {
            code: codeBlock`
                import { Flex, FlexProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Flex",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Flex } from '@twilio-paste/core/flex';
                import { FlexProps } from '@twilio-paste/core/flex';
            `,
        },
        {
            code: codeBlock`
                import { Form, FormProps, FormActions, FormControl, FormControlTwoColumn, FormSection, FormSectionDescription, FormSectionHeading } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Form",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Form, FormProps, FormActions, FormControl, FormControlTwoColumn, FormSection, FormSectionDescription, FormSectionHeading } from '@twilio-paste/core/form';
`,
        },
        {
            code: codeBlock`
                import { FormPillGroup, FormPillGroupProps, FormPill, useFormPillState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > FormPillGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { FormPillGroup, FormPillGroupProps, FormPill, useFormPillState } from '@twilio-paste/core/form-pill-group';
`,
        },
        {
            code: codeBlock`
                import { Grid, GridProps, Column } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Grid",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Grid, GridProps, Column } from '@twilio-paste/core/grid';
`,
        },
        {
            code: codeBlock`
                import { Heading, HeadingProps, HeadingPropTypes } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Heading",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Heading, HeadingProps, HeadingPropTypes } from '@twilio-paste/core/heading';
`,
        },
        {
            code: codeBlock`
                import { HelpText, HelpTextProps, HelpTextVariants } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > HelpText",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { HelpText, HelpTextProps, HelpTextVariants } from '@twilio-paste/core/help-text';
`,
        },
        {
            code: codeBlock`
                import { InPageNavigation, InPageNavigationProps, InPageNavigationItem } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > InPageNavigation",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { InPageNavigation, InPageNavigationProps, InPageNavigationItem } from '@twilio-paste/core/in-page-navigation';
`,
        },
        {
            code: codeBlock`
                import { InlineCode, InlineCodeProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > InlineCode",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { InlineCode } from '@twilio-paste/core/inline-code';
                import { InlineCodeProps } from '@twilio-paste/core/inline-code';
            `,
        },
        {
            code: codeBlock`
                import { InlineControlGroup, InlineControlGroupProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > InlineControlGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { InlineControlGroup } from '@twilio-paste/core/inline-control-group';
                import { InlineControlGroupProps } from '@twilio-paste/core/inline-control-group';
            `,
        },
        {
            code: codeBlock`
                import { Input, InputProps, InputElement } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Input",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Input, InputProps, InputElement } from '@twilio-paste/core/input';
`,
        },
        {
            code: codeBlock`
                import { InputBox, InputBoxProps, InputChevronWrapper, Prefix, Suffix, getInputChevronIconColor } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > InputBox",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { InputBox, InputBoxProps, InputChevronWrapper, Prefix, Suffix, getInputChevronIconColor } from '@twilio-paste/core/input-box';
`,
        },
        {
            code: codeBlock`
                import { Label, LabelProps, RequiredDot } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Label",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Label, LabelProps, RequiredDot } from '@twilio-paste/core/label';
`,
        },
        {
            code: codeBlock`
                import { List, ListProps, ListItem, OrderedList, UnorderedList } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > List",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { List, ListProps, ListItem, OrderedList, UnorderedList } from '@twilio-paste/core/list';
`,
        },
        {
            code: codeBlock`
                import { ListboxPrimitive, ListboxPrimitiveProps, ListboxPrimitiveGroup, ListboxPrimitiveItem, useListboxPrimitiveState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > ListboxPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { ListboxPrimitive, ListboxPrimitiveProps, ListboxPrimitiveGroup, ListboxPrimitiveItem, useListboxPrimitiveState } from '@twilio-paste/core/listbox-primitive';
`,
        },
        {
            code: codeBlock`
                import { MediaObject, MediaObjectProps, MediaBody, MediaFigure } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > MediaObject",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { MediaObject, MediaObjectProps, MediaBody, MediaFigure } from '@twilio-paste/core/media-object';
`,
        },
        {
            code: codeBlock`
                import { Menu, MenuProps, MenuButton, MenuGroup, MenuGroupContext, MenuItem, MenuSeparator, StyledMenuItem, SubMenuButton, useMenuState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Menu",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Menu, MenuProps, MenuButton, MenuGroup, MenuGroupContext, MenuItem, MenuSeparator, StyledMenuItem, SubMenuButton, useMenuState } from '@twilio-paste/core/menu';
`,
        },
        {
            code: codeBlock`
                import { MenuPrimitive, MenuPrimitiveProps, MenuPrimitiveButton, MenuPrimitiveGroup, MenuPrimitiveItem, MenuPrimitiveItemCheckbox, MenuPrimitiveItemRadioMenuItemRadio, MenuPrimitiveSeparator, useMenuPrimitiveState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > MenuPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { MenuPrimitive, MenuPrimitiveProps, MenuPrimitiveButton, MenuPrimitiveGroup, MenuPrimitiveItem, MenuPrimitiveItemCheckbox, MenuPrimitiveItemRadioMenuItemRadio, MenuPrimitiveSeparator, useMenuPrimitiveState } from '@twilio-paste/core/menu-primitive';
`,
        },
        {
            code: codeBlock`
                import { MinimizableDialog, MinimizableDialogProps, MinimizableDialogButton, MinimizableDialogContainer, MinimizableDialogContent, MinimizableDialogHeader, useMinimizableDialogState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > MinimizableDialog",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { MinimizableDialog, MinimizableDialogProps, MinimizableDialogButton, MinimizableDialogContainer, MinimizableDialogContent, MinimizableDialogHeader, useMinimizableDialogState } from '@twilio-paste/core/minimizable-dialog';
`,
        },
        {
            code: codeBlock`
                import { Modal, ModalProps, ModalBody, ModalContext, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading, modalBodyStyles, modalFooterStyles, modalHeaderStyles, useModalContext } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Modal",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Modal, ModalProps, ModalBody, ModalContext, ModalDialogContent, ModalDialogOverlay, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading, modalBodyStyles, modalFooterStyles, modalHeaderStyles, useModalContext } from '@twilio-paste/core/modal';
`,
        },
        {
            code: codeBlock`
                import { NonModalDialogPrimitive, NonModalDialogPrimitiveProps, NonModalDialogArrowPrimitive, NonModalDialogDisclosurePrimitive, useNonModalDialogPrimitiveState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > NonModalDialogPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { NonModalDialogPrimitive, NonModalDialogPrimitiveProps, NonModalDialogArrowPrimitive, NonModalDialogDisclosurePrimitive, useNonModalDialogPrimitiveState } from '@twilio-paste/core/non-modal-dialog-primitive';
`,
        },
        {
            code: codeBlock`
                import { Pagination, PaginationProps, PaginationArrow, PaginationEllipsis, PaginationItems, PaginationLabel, PaginationNumber, PaginationNumbers } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Pagination",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Pagination, PaginationProps, PaginationArrow, PaginationEllipsis, PaginationItems, PaginationLabel, PaginationNumber, PaginationNumbers } from '@twilio-paste/core/pagination';
`,
        },
        {
            code: codeBlock`
                import { Paragraph, ParagraphProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Paragraph",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Paragraph } from '@twilio-paste/core/paragraph';
                import { ParagraphProps } from '@twilio-paste/core/paragraph';
            `,
        },
        {
            code: codeBlock`
                import { Popover, PopoverProps, PopoverBadgeButton, PopoverButton, PopoverContainer, usePopoverState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Popover",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Popover, PopoverProps, PopoverBadgeButton, PopoverButton, PopoverContainer, usePopoverState } from '@twilio-paste/core/popover';
`,
        },
        {
            code: codeBlock`
                import { RadioButtonGroup, RadioButtonGroupProps, RadioButton } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > RadioButtonGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { RadioButtonGroup, RadioButtonGroupProps, RadioButton } from '@twilio-paste/core/radio-button-group';
`,
        },
        {
            code: codeBlock`
                import { RadioGroup, RadioGroupProps, Radio } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > RadioGroup",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { RadioGroup, RadioGroupProps, Radio } from '@twilio-paste/core/radio-group';
`,
        },
        {
            code: codeBlock`
                import { ScreenReaderOnly, ScreenReaderOnlyProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > ScreenReaderOnly",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { ScreenReaderOnly } from '@twilio-paste/core/screen-reader-only';
                import { ScreenReaderOnlyProps } from '@twilio-paste/core/screen-reader-only';
            `,
        },
        {
            code: codeBlock`
                import { Select, SelectProps, Option, OptionGroup, SelectElement } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Select",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Select, SelectProps, Option, OptionGroup, SelectElement } from '@twilio-paste/core/select';
`,
        },
        {
            code: codeBlock`
                import { Separator, SeparatorProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Separator",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Separator } from '@twilio-paste/core/separator';
                import { SeparatorProps } from '@twilio-paste/core/separator';
            `,
        },
        {
            code: codeBlock`
                import { SiblingBox, SiblingBoxProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > SiblingBox",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { SiblingBox } from '@twilio-paste/core/sibling-box';
                import { SiblingBoxProps } from '@twilio-paste/core/sibling-box';
            `,
        },
        {
            code: codeBlock`
                import { SideModal, SideModalProps, SideModalBody, SideModalButton, SideModalContainer, SideModalFooter, SideModalFooterActions, SideModalHeader, SideModalHeading, useSideModalState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > SideModal",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { SideModal, SideModalProps, SideModalBody, SideModalButton, SideModalContainer, SideModalFooter, SideModalFooterActions, SideModalHeader, SideModalHeading, useSideModalState } from '@twilio-paste/core/side-modal';
`,
        },
        {
            code: codeBlock`
                import { Sidebar, SidebarProps, SidebarCollapseButton, SidebarCollapseButtonWrapper, SidebarContext, SidebarHeader, SidebarOverlayContentWrapper, SidebarPushContentWrapper } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Sidebar",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Sidebar, SidebarProps, SidebarCollapseButton, SidebarCollapseButtonWrapper, SidebarContext, SidebarHeader, SidebarOverlayContentWrapper, SidebarPushContentWrapper } from '@twilio-paste/core/sidebar';
`,
        },
        {
            code: codeBlock`
                import { SkeletonLoader, SkeletonLoaderProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > SkeletonLoader",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { SkeletonLoader } from '@twilio-paste/core/skeleton-loader';
                import { SkeletonLoaderProps } from '@twilio-paste/core/skeleton-loader';
            `,
        },
        {
            code: codeBlock`
                import { Spinner, SpinnerProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Spinner",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Spinner } from '@twilio-paste/core/spinner';
                import { SpinnerProps } from '@twilio-paste/core/spinner';
            `,
        },
        {
            code: codeBlock`
                import { Stack, StackProps, getStackChildMargins, getStackDisplay, getStackStyles } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Stack",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Stack, StackProps, getStackChildMargins, getStackDisplay, getStackStyles } from '@twilio-paste/core/stack';
`,
        },
        {
            code: codeBlock`
                import { Switch, SwitchProps, SwitchGroup } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Switch",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Switch, SwitchProps, SwitchGroup } from '@twilio-paste/core/switch';
`,
        },
        {
            code: codeBlock`
                import { Table, TableProps, TBody, TBodyPropTypes, TFoot, TFootPropTypes, THead, THeadPropTypes, TablePropTypes, Td, TdPropTypes, Th, ThPropTypes, Tr, TrPropTypes } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Table",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Table, TableProps, TBody, TBodyPropTypes, TFoot, TFootPropTypes, THead, THeadPropTypes, TablePropTypes, Td, TdPropTypes, Th, ThPropTypes, Tr, TrPropTypes } from '@twilio-paste/core/table';
`,
        },
        {
            code: codeBlock`
                import { Tabs, TabsProps, TabList, TabPanel, TabPanels, Tab, useTabState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Tabs",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Tabs, TabsProps, TabList, TabPanel, TabPanels, Tab, useTabState } from '@twilio-paste/core/tabs';
`,
        },
        {
            code: codeBlock`
                import { Text, TextProps, StyledText, TEXT_PROPS_TO_BLOCK, safelySpreadTextProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Text",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Text, TextProps, StyledText, TEXT_PROPS_TO_BLOCK, safelySpreadTextProps } from '@twilio-paste/core/text';
`,
        },
        {
            code: codeBlock`
                import { Theme } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Theme",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Theme } from '@twilio-paste/core/theme';
            `,
        },
        {
            code: codeBlock`
                import { TimePicker, TimePickerProps, formatReturnTime } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > TimePicker",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { TimePicker, TimePickerProps, formatReturnTime } from '@twilio-paste/core/time-picker';
`,
        },
        {
            code: codeBlock`
                import { Toast, ToastProps, AnimatedToast, ToastContainer, Toaster, useToaster } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Toast",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Toast, ToastProps, AnimatedToast, ToastContainer, Toaster, useToaster } from '@twilio-paste/core/toast';
`,
        },
        {
            code: codeBlock`
                import { Tooltip, TooltipProps, useTooltipState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Tooltip",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { Tooltip, TooltipProps, useTooltipState } from '@twilio-paste/core/tooltip';
`,
        },
        {
            code: codeBlock`
                import { TooltipPrimitive, TooltipPrimitiveProps, TooltipPrimitiveArrow, TooltipPrimitiveReference, useTooltipPrimitiveState } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > TooltipPrimitive",
            options: [TWILIO_PASTE_IMPORTS],
            output: `import { TooltipPrimitive, TooltipPrimitiveProps, TooltipPrimitiveArrow, TooltipPrimitiveReference, useTooltipPrimitiveState } from '@twilio-paste/core/tooltip-primitive';
`,
        },
        {
            code: codeBlock`
                import { Truncate, TruncateProps } from '@twilio-paste/core';
            `,
            errors: [
                {
                    messageId: "preferImport",
                },
            ],
            name: "Twilio Paste Imports > Truncate",
            options: [TWILIO_PASTE_IMPORTS],
            output: codeBlock`
                import { Truncate } from '@twilio-paste/core/truncate';
                import { TruncateProps } from '@twilio-paste/core/truncate';
            `,
        },

        // #endregion Twilio Paste Import Tests
    ],
    valid: [
        {
            code: codeBlock`
                import { Box } from '@twilio-paste/core/box'
            `,
            options: [
                {
                    "@twilio-paste/core": {
                        importName: "Box",
                        replacementModuleSpecifier: "@twilio-paste/core/box",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                import { SomeOtherNode as Node } from '@/types';
                const foo: Node = {}
            `,
            name: "global > aliased name is allowed regardless of module specifier",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                import { Node } from '@/types';
                const foo: Node = {}
            `,
            name: "global > import is allowed with same module specifier",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                import { Node } from '@/types/node';
                const foo: Node = {}
            `,
            name: "global > import is allowed with different module specifier when no other rule to replace import is defined",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                type Node = {};
                const foo: Node = {}
            `,
            name: "global > no error is reported when type is defined locally",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                interface Node {};
                const foo: Node = {}
            `,
            name: "global > no error is reported when interface is defined locally",
            options: [
                {
                    global: {
                        importName: "Node",
                        replacementModuleSpecifier: "@/types",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                import { Math } from '@/utilities';
                const foo = Math.floor(0.5)
            `,
            name: "global > allows imported global object",
            options: [
                {
                    global: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                const Math = { floor: (n: number) => n };
                const foo = Math.floor(0.5)
            `,
            name: "global > no error when local variable shadows global",
            options: [
                {
                    global: {
                        importName: "Math",
                        replacementModuleSpecifier: "@/utilities",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                import { Text } from '@/components';
                const elem = <Text>Hello</Text>
            `,
            languageOptions: {
                parserOptions: {
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            name: "global > allows imported JSX component",
            options: [
                {
                    global: {
                        importName: "Text",
                        replacementModuleSpecifier: "@/components",
                    },
                },
            ],
        },
        {
            code: codeBlock`
                const Text = (props) => <div>{props.children}</div>;
                const elem = <Text>Hello</Text>
            `,
            languageOptions: {
                parserOptions: {
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            name: "global > no error when JSX component is a local variable",
            options: [
                {
                    global: {
                        importName: "Text",
                        replacementModuleSpecifier: "@/components",
                    },
                },
            ],
        },
    ],
});
