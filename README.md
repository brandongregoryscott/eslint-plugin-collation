<p align="center">
    <a href="https://eslint-plugin-collation.brandonscott.me/#gh-light-mode-only">
        <img src="https://raw.githubusercontent.com/brandongregoryscott/collation/main/documentation/static/img/collation-hero-light.png" width="75%" height="75%"/>
    </a>
        <a href="https://eslint-plugin-collation.brandonscott.me/#gh-dark-mode-only">
        <img src="https://raw.githubusercontent.com/brandongregoryscott/collation/main/documentation/static/img/collation-hero-dark.png" width="75%" height="75%"/>
    </a>
    <br/>
    <a href="https://github.com/brandongregoryscott/collation/actions/workflows/build.yaml">
        <img alt="build status" src="https://github.com/brandongregoryscott/collation/actions/workflows/build.yaml/badge.svg"/>
    </a>
    <a href="https://github.com/brandongregoryscott/collation/actions/workflows/smoke-test.yaml">
        <img alt="smoke test status" src="https://github.com/brandongregoryscott/collation/actions/workflows/smoke-test.yaml/badge.svg"/>
    </a>
    <a href="https://github.com/prettier/prettier">
        <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"/>
    </a>
    <a href="http://www.typescriptlang.org/">
        <img alt="TypeScript" src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg"/>
    </a>
        <a href="http://commitizen.github.io/cz-cli/">
        <img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg"/>
    </a>
    <a href="https://github.com/semantic-release/semantic-release">
        <img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release"/>
    </a>
</p>

ESLint plugin for making your code easier to read, with autofix and TypeScript support

## Installation

```sh
npm install eslint eslint-plugin-collation @typescript-eslint/parser --save-dev
```

## Usage

Add `collation` to the plugins and rules section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "parser": "@typescript-eslint/parser",
    "plugins": ["collation"],
    "rules": {
        "collation/group-exports": "warn",
        "collation/no-default-export": "warn",
        "collation/no-inline-export": "warn",
        "collation/sort-dependency-list": "warn",
        "collation/sort-exports": "warn"
    }
}
```

> :warning: You will need to specify `@typescript-eslint/parser` in your `.eslintrc` file even if you aren't using TypeScript.

## Rules

| Rule                                                                                                              | Description                                       | Fixable  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| [collation/group-exports](https://eslint-plugin-collation.brandonscott.me/docs/rules/group-exports)               | Consolidates multiple export statements           | :wrench: |
| [collation/no-default-export](https://eslint-plugin-collation.brandonscott.me/docs/rules/no-inline-export)        | Enforces exports to be named                      | :wrench: |
| [collation/no-inline-export](https://eslint-plugin-collation.brandonscott.me/docs/rules/no-inline-export)         | Enforces exports to appear at the end of the file | :wrench: |
| [collation/sort-dependency-list](https://eslint-plugin-collation.brandonscott.me/docs/rules/sort-dependency-list) | Sorts React dependency lists                      | :wrench: |
| [collation/sort-exports](https://eslint-plugin-collation.brandonscott.me/docs/rules/sort-exports)                 | Sorts specifiers in an export statement           | :wrench: |

For documentation and examples for the available rules, see [Rules](https://eslint-plugin-collation.brandonscott.me/docs/rules/)
