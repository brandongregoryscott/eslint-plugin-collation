---
sidebar_position: 1
---

# Rules

This plugin implements various different rules to make your code more consistent and easier to read, with the idea that **all rules should be fixable**.

:wrench: if some problems reported by the rule are automatically fixable by the `--fix` command line option

:warning: if some problems reported by the rule are manually fixable by editor suggestions

| Rule                                                                                                                              | Description                                                                                                | Fixable  |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| [collation/group-exports](https://eslint-plugin-collation.brandonscott.me/docs/rules/group-exports)                               | Consolidates multiple export statements                                                                    | :wrench: |
| [collation/no-default-export](https://eslint-plugin-collation.brandonscott.me/docs/rules/no-inline-export)                        | Enforces exports to be named                                                                               | :wrench: |
| [collation/no-inline-export](https://eslint-plugin-collation.brandonscott.me/docs/rules/no-inline-export)                         | Enforces exports to appear at the end of the file                                                          | :wrench: |
| [collation/prefer-import](https://eslint-plugin-collation.brandonscott.me/docs/rules/prefer-import)                               | Enforces imports from a preferred module, i.e. for wrapped library functionality or ESM-friendly packages. | :wrench: |
| [collation/prefer-native-private-syntax](https://eslint-plugin-collation.brandonscott.me/docs/rules/prefer-native-private-syntax) | Prefer native #private class members over TypeScript private modifier                                      | :wrench: |
| [collation/sort-dependency-list](https://eslint-plugin-collation.brandonscott.me/docs/rules/sort-dependency-list)                 | Sorts React dependency lists                                                                               | :wrench: |
| [collation/sort-exports](https://eslint-plugin-collation.brandonscott.me/docs/rules/sort-exports)                                 | Sorts specifiers in an export statement                                                                    | :wrench: |
