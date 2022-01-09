import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

type FeatureItem = {
    title: string;
    image: string;
    description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
    {
        title: "Code should be easy to read",
        image: "/assets/undraw_docusaurus_mountain.svg",
        description: (
            <>
                The more consistent your codebase is, the easier it is to
                maintain
            </>
        ),
    },
    {
        title: "Consistency should be automated",
        image: "/assets/undraw_docusaurus_tree.svg",
        description: (
            <>
                Code consistency should be enforced by tooling to avoid
                unnecessary mental cycles and effort
            </>
        ),
    },
    {
        title: "Plug & Play",
        image: "/assets/undraw_docusaurus_react.svg",
        description: (
            <>
                Pick and choose the rules that you want to use, run on specific
                files only, or use it as a linter to fail CI builds
            </>
        ),
    },
];

function Feature({ title, image, description }: FeatureItem) {
    return (
        <div className={clsx("col col--4")}>
            <div className="text--center">
                <img className={styles.featureSvg} alt={title} src={image} />
            </div>
            <div className="text--center padding-horiz--md">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
