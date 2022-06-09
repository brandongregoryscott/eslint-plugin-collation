// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "collation",
    tagline: "ESLint plugin for making your code easier to read",
    url: "https://eslint-plugin-collation.brandonscott.me/",
    baseUrl: "/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.ico",
    organizationName: "brandongregoryscott", // Usually your GitHub org/user name.
    projectName: "eslint-plugin-collation", // Usually your repo name.

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    editUrl:
                        "https://github.com/brandongregoryscott/eslint-plugin-collation/tree/main/documentation/",
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: "collation",
                logo: {
                    alt: "collation logo",
                    src: "img/logo.svg",
                },
                items: [
                    {
                        type: "doc",
                        docId: "intro",
                        position: "left",
                        label: "Docs",
                    },
                    {
                        href: "https://github.com/brandongregoryscott/eslint-plugin-collation",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: "dark",
                links: [
                    {
                        title: "Docs",
                        items: [
                            {
                                label: "Intro",
                                to: "/docs/intro",
                            },
                            {
                                label: "Rules",
                                to: "/docs/rules",
                            },
                        ],
                    },
                    {
                        title: "More",
                        items: [
                            {
                                label: "GitHub",
                                href: "https://github.com/brandongregoryscott/eslint-plugin-collation",
                            },
                            {
                                label: "npm",
                                href: "https://www.npmjs.com/package/eslint-plugin-collation",
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Brandon Scott. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
