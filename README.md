<h1 align="center">collation</h1>
<p align="center">
    <a href="https://github.com/brandongregoryscott/collation/actions/workflows/build.yaml">
        <img alt="build status" src="https://github.com/brandongregoryscott/collation/actions/workflows/build.yaml/badge.svg"/>
    </a>
    <a href="https://github.com/prettier/prettier">
        <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"/>
    </a>
    <a href="http://www.typescriptlang.org/">
        <img alt="TypeScript" src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg"/>
    </a>
</p>

> **Collation** is the assembly of written information into a standard order.

Code linting/manipulation tools to make your TypeScript code easier to read

## Usage

Currently, `collation` ships with a CLI that can be run manually or plugged into your git hooks to
run when files are changed. Internally, `ts-morph` is used for reading and manipulating the AST and must be installed alongside.

```sh
npm install --save-dev collation ts-morph

# Verify installation and show help menu
npx collation --help

# Run on specific file
npx collation --files button.tsx

# Run on list of files
npx collation --files button.tsx dialog.tsx
```

See [`.husky/pre-commit`](.husky/pre-commit) for an example of usage in a git hook.

## Rules

This project implements various different rules to make your code more consistent and easier to read - similar to tools like `ESLint`, with the idea that **all rules should be fixable without intervention**. Eventually, rules will be be "à la carte" via flags or a configuration file with the ability to opt in to specific rules (and whether or not to auto-fix them).

Current rules:

1. `alphabetize-dependency-lists`
    - Alphabetizes React dependency lists, i.e.
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
1. `alphabetize-enums`
    - Alphabetizes members of explicitly defined enums, i.e.
    ```ts
    enum Animals {
        Dog = "dog",
        Wolf = "wolf",
        Cat = "cat",
    }
    ```
    will be transformed to:
    ```ts
    enum Animals {
        Cat = "cat",
        Dog = "dog",
        Wolf = "wolf",
    }
    ```
1. `alphabetize-interfaces`
    - Alphabetizes properties in an interface, i.e.
    ```ts
    interface Example {
        zeta?: string;
        beta: Record<string, string>;
        alpha: number;
        omicron: () => void;
    }
    ```
    will be transformed to:
    ```ts
    interface Example {
        alpha: number;
        beta: Record<string, string>;
        omicron: () => void;
        zeta?: string;
    }
    ```
1. `alphabetize-jsx-props`
    - Alphabetizes props for components/JSX elements, i.e.
    ```tsx
    return (
        <Button onClick={() => {}} type="submit" disabled={isLoading}>
            Example
        </Button>
    );
    ```
    will be transformed to:
    ```tsx
    return (
        <Button disabled={isLoading} onClick={() => {}} type="submit">
            Example
        </Button>
    );
    ```

## Debugging

If you aren't sure what files/project is being picked up, you can run the CLI with the `--print-project` (or `-p`) flag to print some additional information.

```sh
npx collation --print-project

Compiler options:
{
    "_defaultSettings": {},
    "_settings": {
        "allowJs": true,
        "allowSyntheticDefaultImports": true,
        "baseUrl": "/Users/Brandon/example/src",
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
        "configFilePath": "/Users/Brandon/example/tsconfig.json"
    },
    "_modifiedEventContainer": {
        "subscriptions": [
            null
        ]
    }
}

Source files:
[
    "/Users/Brandon/beets/src/app.tsx",
    "/Users/Brandon/beets/src/index.tsx",
    "/Users/Brandon/beets/src/react-app-env.d.ts",
    # ...
]
```

## Notes

-   This package does not do any additional formatting/processing on the code that's emitted from the TS compiler. For example, multi-line props for a component may be lifted up to a single line once they are alphabetized with `alphabetize-jsx-props`. It is recommended that you use a tool like `prettier` after your code has been transformed from `collation`.
