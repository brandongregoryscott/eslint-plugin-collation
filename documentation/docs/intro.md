---
sidebar_position: 1
title: "Intro"
---

# What is collation, and why use it?

> Collation is the assembly of written information into a standard order.

In the first chapter of [Uncle Bob](http://cleancoder.com/)'s _Clean Code_, he describes a major motivation behind writing clean code is to make it easier to read and update later:

> Indeed, the ratio of time spent reading vs. writing is well over 10:1. We are _constantly_ reading old code as part of the effort to write new code.

> Because the ratio is so high, we want the reading of code to be easy, even if it makes the writing harder. Of course there's no way to write code without reading it, so _making it easy to read actually makes it easier to write._

While there are many factors that play into the health of a codebase, many engineers will agree that consistency of how the code is written and organized is important. The less time you need to _mentally parse_ what a component or function is doing, the quicker you can move on to making the necessary changes in confidence.

That being said, no one enjoys the effort that consistency requires - whether that's formatting the code to 80 lines, using tabs vs. spaces, trailing semicolons, etc. The overhead that this requires to keep up manually isn't worth the effort, which is why tools like [`ESLint`](https://eslint.org/) and [`Prettier`](https://prettier.io/) exist.

This ESLint plugin contains rules that fit my personal organization preferences and either don't exist or aren't fixable by default - maybe you'll find it useful too!

# Installation

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
