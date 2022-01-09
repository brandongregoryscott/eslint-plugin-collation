---
sidebar_position: 1
---

# What is collation, and why use it?

> Collation is the assembly of written information into a standard order.

In the first chapter of [Uncle Bob](http://cleancoder.com/)'s _Clean Code_, he describes a major motivation behind writing clean code is to make it easier to read and update later:

> Indeed, the ratio of time spent reading vs. writing is well over 10:1. We are _constantly_ reading old code as part of the effort to write new code.

> Because the ratio is so high, we want the reading of code to be easy, even if it makes the writing harder. Of course there's no way to write code without reading it, so _making it easy to read actually makes it easier to write._

While there are many factors that play into the health of a codebase, many engineers will agree that consistency of how the code is written and organized is important. The less time you need to _mentally parse_ what a component or function is doing, the quicker you can move on to making the necessary changes in confidence.

That being said, no one enjoys the effort that consistency requires - whether that's formatting the code to 80 lines, using tabs vs. spaces, trailing semicolons, etc. The overhead that this requires to keep up manually isn't worth the effort, which is why tools like [`ESLint`](https://eslint.org/) and [`Prettier`](https://prettier.io/) exist.

These tools are great, but there are certain styles of formatting/organization that require additional plugins, complex configuration or aren't supported at all. I wrote `collation` as a tool to fit my personal organization preferences on my projects and maybe you'll find it useful, too.

# Getting Started

`collation` ships with a CLI that can be run manually, in a CI pipeline or pre-commit hook.

Get started using `collation` by running `npx collation -f <file>` in a TypeScript project:

```sh
ls -l
drwxr-xr-x  1161 Brandon  staff    37152 Jan  8 10:23 node_modules
-rw-r--r--     1 Brandon  staff  1870419 Jan  8 10:23 package-lock.json
-rw-r--r--     1 Brandon  staff     3533 Jan  8 10:23 package.json
drwxr-xr-x    21 Brandon  staff      672 Jan  7 20:48 src
-rw-r--r--     1 Brandon  staff      627 Dec 31 21:04 tsconfig.json

npx collation -f profile-menu.tsx
[collation] ERROR alphabetize-interfaces profile-menu.tsx:16 Expected property 'onClose' in 'ProfileMenuProps' (index 0) to be at index 1. ('onClose' should appear alphabetically after 'onAboutDialogClick'.)
[collation] ERROR alphabetize-interfaces profile-menu.tsx:15 Expected property 'onAboutDialogClick' in 'ProfileMenuProps' (index 1) to be at index 0. ('onAboutDialogClick' should appear alphabetically before 'onClose'.)
```

By default, `collation` will report rule violations and attempt to fix the errors in the file(s).

The interface originally looked like this:

```ts title="src/components/profile-menu.tsx"
interface ProfileMenuProps {
    onClose: () => void;
    onAboutDialogClick: () => void;
}
```

and `collation` updated it to this:

```ts title="src/components/profile-menu.tsx"
interface ProfileMenuProps {
    onAboutDialogClick: () => void;
    onClose: () => void;
}
```

If you're only checking for rule violations and you don't want to automatically update the code, you can run `collation` with the `--dry` flag:
`npx collation -f profile-menu.tsx --dry`

A full list of CLI options can be found [here](http://google.com) or by specifying the `--help` flag: `npx collation --help`

### Note

`npx collation` can be run from anywhere, but it will do a full install of the package to run if it can't be found in the current `npm` project.

If you're planning on running it regularly for your project, it is faster to keep it installed as a local development dependency, because [`npx`](https://docs.npmjs.com/cli/v8/commands/npx) will prefer this version and not reinstall on each invocation:

```sh
npm install --save-dev collation
```
