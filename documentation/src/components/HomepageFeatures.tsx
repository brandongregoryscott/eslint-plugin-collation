import React from "react";
import styles from "./HomepageFeatures.module.css";
import { Feature, FeatureProps } from "@site/src/components/Feature";
import clsx from "clsx";

const FeatureList: FeatureProps[] = [
    {
        title: "Code should be easy to read",
        image: "img/undraw_docusaurus_mountain.svg",
        description: (
            <>
                The more consistent your codebase is, the easier it is to
                maintain
            </>
        ),
    },
    {
        title: "Consistency should be automated",
        image: "img/undraw_docusaurus_tree.svg",
        description: (
            <>
                Code consistency should be enforced by tooling to avoid
                unnecessary mental cycles and effort
            </>
        ),
    },
];

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className={clsx("row", styles.row)}>
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
