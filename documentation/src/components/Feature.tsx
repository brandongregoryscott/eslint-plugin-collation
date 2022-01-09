import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import clsx from "clsx";
import React from "React";
import styles from "./Feature.module.css";

interface FeatureProps {
    title: string;
    image: string;
    description: JSX.Element;
}

const Feature: React.FC<FeatureProps> = (props: FeatureProps) => {
    const { title, image, description } = props;
    const { siteConfig } = useDocusaurusContext();

    return (
        <div className={clsx("col col--4")}>
            <div className="text--center">
                <img
                    className={styles.featureSvg}
                    alt={title}
                    src={`${siteConfig.baseUrl}${image}`}
                />
            </div>
            <div className="text--center padding-horiz--md">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
};

export { Feature, FeatureProps };
