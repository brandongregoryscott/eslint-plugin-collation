// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "collation",
    tagline:
        "Code linting/manipulation tools to make your TypeScript code easier to read",
    url: "https://brandongregoryscott.github.io/",
    baseUrl: "/collation/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.ico",
    organizationName: "brandongregoryscott", // Usually your GitHub org/user name.
    projectName: "collation", // Usually your repo name.

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    editUrl:
                        "https://github.com/brandongregoryscott/collation/tree/main/documentation/docs/",
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
                        href: "https://github.com/brandongregoryscott/collation",
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
                                label: "CLI Options",
                                to: "/docs/cli/options",
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
                                href: "https://github.com/facebook/docusaurus",
                            },
                            {
                                label: "npm",
                                href: "https://www.npmjs.com/package/collation",
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
