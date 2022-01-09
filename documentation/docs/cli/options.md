---
sidebar_position: 1
---

# Options

This page contains a listing of the available options when running the CLI. You can also find this information by running `npx collation --help`.

## All

Flags: `-a, --all`

Description: Run for all files in project

Example:

```sh
npx collation --all
[collation] ERROR alphabetize-interfaces profile-menu.tsx:16 Expected property 'onClose' in 'ProfileMenuProps' (index 0) to be at index 1. ('onClose' should appear alphabetically after 'onAboutDialogClick'.)
[collation] ERROR alphabetize-interfaces profile-menu.tsx:15 Expected property 'onAboutDialogClick' in 'ProfileMenuProps' (index 1) to be at index 0. ('onAboutDialogClick' should appear alphabetically before 'onClose'.)
```

## Dry

Flags: `-d, --dry`

Description: Run without saving changes

Example:

```sh
npx collation --dry
[collation] ERROR alphabetize-interfaces profile-menu.tsx:16 Expected property 'onClose' in 'ProfileMenuProps' (index 0) to be at index 1. ('onClose' should appear alphabetically after 'onAboutDialogClick'.)
[collation] ERROR alphabetize-interfaces profile-menu.tsx:15 Expected property 'onAboutDialogClick' in 'ProfileMenuProps' (index 1) to be at index 0. ('onAboutDialogClick' should appear alphabetically before 'onClose'.)
```

## Help

Flags: `-h, --help`

Description: Outputs the help menu with command and flag information

Example:

```sh
npx collation --help
Usage: collation [options]

Code linting/manipulation tools to make your TypeScript code easier to read

Options:
  -V, --version                      output the version number
  -a, --all                          Run for all files in project
  -d, --dry                          Run without saving changes
  -f, --files [fileNamesOrPaths...]  Run on specific file(s) (e.g. --files button.tsx form.tsx)
  -p, --print-project                Output debugging information about detected TypeScript project
  -r, --rules [ruleNames...]         Run specific rules only
  -s, --silent                       Silence all logs in output
  -v, --verbose                      Include debug-level logs in output
  -h, --help                         display help for command
```

## Files

Flags: `-f, --files`

Description: Run on specific file(s) (e.g. --files button.tsx form.tsx)

Example:

```sh
npx collation --files profile-menu.tsx
[collation] ERROR alphabetize-interfaces profile-menu.tsx:16 Expected property 'onClose' in 'ProfileMenuProps' (index 0) to be at index 1. ('onClose' should appear alphabetically after 'onAboutDialogClick'.)
[collation] ERROR alphabetize-interfaces profile-menu.tsx:15 Expected property 'onAboutDialogClick' in 'ProfileMenuProps' (index 1) to be at index 0. ('onAboutDialogClick' should appear alphabetically before 'onClose'.)
```

## Print Project

Flags: `--print-project`

Description: Output debugging information about detected TypeScript project

Example:

```sh
npx collation --print-project
[collation] Compiler options:
{
    "_defaultSettings": {},
    "_settings": {
        "allowJs": true,
        "allowSyntheticDefaultImports": true,
        "baseUrl": "/Users/Brandon/beets/src",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "isolatedModules": true,
        "jsx": 4,
        "lib": [
            "lib.dom.d.ts",
            "lib.dom.iterable.d.ts",
            "lib.esnext.d.ts"
        ],
        "module": 99,
        "moduleResolution": 2,
        "noEmit": true,
        "noFallthroughCasesInSwitch": true,
        "resolveJsonModule": true,
        "skipLibCheck": true,
        "strict": true,
        "target": 1,
        "configFilePath": "/Users/Brandon/beets/tsconfig.json"
    },
    "_modifiedEventContainer": {
        "subscriptions": [
            null
        ]
    }
}
[collation] Source files:
[
    "/Users/Brandon/beets/src/app.tsx",
    "/Users/Brandon/beets/src/index.tsx",
    "/Users/Brandon/beets/src/routes.ts",
    # ...
]
```

## Rules

Flags: `-r, --rules`

Description: Run specific rules only

Example:

```sh
npx collation --rules alphabetize-interfaces
[collation] ERROR alphabetize-interfaces profile-menu.tsx:16 Expected property 'onClose' in 'ProfileMenuProps' (index 0) to be at index 1. ('onClose' should appear alphabetically after 'onAboutDialogClick'.)
[collation] ERROR alphabetize-interfaces profile-menu.tsx:15 Expected property 'onAboutDialogClick' in 'ProfileMenuProps' (index 1) to be at index 0. ('onAboutDialogClick' should appear alphabetically before 'onClose'.)
```

## Silent

Flags: `-s, --silent`

Description: Silence all logs in output

Example:

```sh
npx collation --silent
```

## Verbose

Flags: `-v, --verbose`

Description: Include debug-level logs in output

Example:

```sh
npx collation --verbose
[collation] DEBUG alphabetize-dependency-lists profile-menu.tsx:23 Dependency list for useCallback already sorted.
[collation] DEBUG alphabetize-dependency-lists profile-menu.tsx:36 Dependency list for useCallback already sorted.
[collation] DEBUG alphabetize-dependency-lists profile-menu.tsx:41 Dependency list for useCallback already sorted.
[collation] DEBUG alphabetize-dependency-lists profile-menu.tsx:46 Dependency list for useCallback already sorted.
[collation] DEBUG alphabetize-interfaces profile-menu.tsx:14 Properties of interface ProfileMenuProps are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:52 Props for <Menu /> are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:53 Props for <Menu.Item /> are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:57 Props for <Menu.Item /> are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:62 Props for <Fragment /> are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:63 Props for <Menu.Item /> are already sorted.
[collation] DEBUG alphabetize-jsx-props profile-menu.tsx:66 Props for <Menu.Item /> are already sorted.
```

## Version

Flags: `-V, --version`

Description: Outputs the current version number

Example:

```sh
npx collation -V
0.4.0
```
