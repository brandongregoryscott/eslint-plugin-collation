<p align="center">
    <a href="https://collation.brandonscott.me/#gh-light-mode-only">
        <img src="https://raw.githubusercontent.com/brandongregoryscott/collation/main/documentation/static/img/collation-hero-light.png" width="75%" height="75%"/>
    </a>
        <a href="https://collation.brandonscott.me/#gh-dark-mode-only">
        <img src="https://raw.githubusercontent.com/brandongregoryscott/collation/main/documentation/static/img/collation-hero-dark.png" width="75%" height="75%"/>
    </a>
    <br/>
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

Code linting/manipulation tools to make your TypeScript code easier to read

## Usage

Currently, `collation` ships with a CLI that can be run manually or plugged into your git hooks to
run when files are changed.

```sh
npm install --save-dev collation

# Verify installation and show help menu
npx collation --help

# Run on specific file
npx collation --files button.tsx

# Run on list of files
npx collation --files button.tsx dialog.tsx
```

See [`.husky/pre-commit`](.husky/pre-commit) for an example of usage in a git hook.

## Rules

This project implements various different rules to make your code more consistent and easier to read - similar to tools like `ESLint`, with the idea that **all rules should be fixable without intervention**.

For documentation on the available rules, see [Rules](https://brandongregoryscott.github.io/collation/docs/rules)

## Notes

-   This package does not do any additional formatting/processing on the code that's emitted from the TS compiler. For example, multi-line props for a component may be lifted up to a single line once they are alphabetized with `alphabetize-jsx-props`. It is recommended that you use a tool like `prettier` after your code has been transformed from `collation`.

## Adding a new rule

When adding a new rule, there are a few places that need to be updated:

-   The rule name must be added to [`rule-name.ts`](./src/enums/rule-name.ts)
-   The function that should accept a [`SourceFile`](https://ts-morph.com/details/source-files) should be created at [`src/rules/<rule-name>.ts`](./src/rules/)
-   The function should have a test file next to its implementation, i.e. [`src/rules/<rule-name>.test.ts`](./src/rules/)
-   The function needs to be mapped to its rule name in [`src/constants/rule-map.ts`](./src/constants/rule-map.ts)

A small CLI has been created for internally scaffolding out these changes given a rule name:
`npm run internal-codegen -- --name new-rule-name`
