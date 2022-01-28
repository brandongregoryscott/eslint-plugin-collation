import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import ThemedImage from "@theme/ThemedImage";
import styles from "./index.module.css";
import HomepageFeatures from "../components/HomepageFeatures";

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
                <ThemedImage
                    alt="collation hero image"
                    width="50%"
                    height="50%"
                    sources={{
                        light: "img/collation-hero-dark.png",
                        dark: "img/collation-hero-light.png",
                    }}
                />
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to="/docs/intro">
                        Get started
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`${siteConfig.title} docs`}
            description={siteConfig.tagline}>
            <HomepageHeader />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
}
