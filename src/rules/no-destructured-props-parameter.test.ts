import { codeBlock } from "common-tags";
import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noDestructuredPropsParameter } from "./no-destructured-props-parameter";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run(
    "no-destructured-props-parameter",
    noDestructuredPropsParameter,
    {
        valid: [
            codeBlock`
                import { memo } from "react";
                function helper(memo) {
                    return memo(({ value }) => value);
                }
            `,
            codeBlock`
                function helper(React) {
                    return React.memo(({ value }) => value);
                }
            `,
            codeBlock`
                import React from "other";
                const value = React.memo(({ value }) => value);
            `,

            codeBlock`
                import { memo } from "react";
                const Badge = memo(Component, ({ value }, next) => value === next.value);
            `,
            codeBlock`
                const Badge = React.memo(Component, ({ value }, next) => value === next.value);
            `,
            codeBlock`
                const Badge: FC<Props> = ({ value }) => null;
            `,

            codeBlock`
                const Badge = (props) => {
                    const { children } = props;
                    return <span>{children}</span>;
                };
            `,
            codeBlock`
                function Badge(props) {
                    return <span>{props.children}</span>;
                }
            `,
            codeBlock`
                const Badge = () => <span />;
            `,
            codeBlock`
                const helper = ({ value }) => value;
            `,
            codeBlock`
                function Helper({ value }) {
                    return value;
                }
            `,
            codeBlock`
                const renderItem = ({ value }) => <span>{value}</span>;
            `,
            codeBlock`
                items.map(({ value }) => <span>{value}</span>);
            `,
            codeBlock`
                const Badge = (props) => items.map(({ value }) => <span>{value}</span>);
            `,
            codeBlock`
                function Helper({ value }) {
                    function Inner() {
                        return <span />;
                    }
                    return value;
                }
            `,
            codeBlock`
                function Helper({ value }) {
                    const render = () => <span />;
                    return value;
                }
            `,
            codeBlock`
                function Helper({ value }) {
                    const element = <span />;
                    return value;
                }
            `,
            codeBlock`
                function Helper({ value }) {
                    return { element: <span /> };
                }
            `,
            codeBlock`
                class Badge {
                    render({ value }) {
                        return <span />;
                    }
                }
            `,
            codeBlock`
                const Component = (props, { value }) => <span />;
            `,
            codeBlock`
                const value = other.memo(({ value }) => value);
            `,
            codeBlock`
                import { memo } from "other";
                const value = memo(({ value }) => value);
            `,
            codeBlock`
                import { memo } from "react";
                const Badge = memo((props) => {
                    const { children } = props;
                    return <span>{children}</span>;
                });
            `,
            codeBlock`
                const Badge: React.FC<Props> = (props) => {
                    const { children } = props;
                    return null;
                };
            `,
        ],
        invalid: [
            {
                code: codeBlock`
                    const Badge = (
                        { children } // keep
                        : Props
                    ) => <span />;
                `,
                output: codeBlock`
                    const Badge = (
                        props: Props
                    ) => {
                    const { children } // keep
                         = props;
                    return (
                    <span />
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ value }) => {
                        value += 1;
                        return <span>{value}</span>;
                    };
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    let { value } = props;

                        value += 1;
                        return <span>{value}</span>;
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ value }) => {
                        const bump = () => value++;
                        bump();
                        return <span>{value}</span>;
                    };
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    let { value } = props;

                        const bump = () => value++;
                        bump();
                        return <span>{value}</span>;
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ value }) => (
                        <span>
                            {props.value}
                            {value}
                        </span>
                    );
                `,
                output: codeBlock`
                    const Badge = (props2) => {
                    const { value } = props2;
                    return (
                    (
                        <span>
                            {props.value}
                            {value}
                        </span>
                    )
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ props, props2 }) => (
                        <span>
                            {props}
                            {props2}
                        </span>
                    );
                `,
                output: codeBlock`
                    const Badge = (props3) => {
                    const { props, props2 } = props3;
                    return (
                    (
                        <span>
                            {props}
                            {props2}
                        </span>
                    )
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ user: { name }, values: [first] }) => (
                        <span>
                            {name}
                            {first}
                        </span>
                    );
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { user: { name }, values: [first] } = props;
                    return (
                    (
                        <span>
                            {name}
                            {first}
                        </span>
                    )
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ /* keep */ children }: Props) => (
                        <span>{children}</span>
                    );
                `,
                output: codeBlock`
                    const Badge = (props: Props) => {
                    const { /* keep */ children } = props;
                    return (
                    (
                        <span>{children}</span>
                    )
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    function Badge({ children }) {
                        "use client";
                        return <span>{children}</span>;
                    }
                `,
                output: codeBlock`
                    function Badge(props) {
                        "use client";
                    const { children } = props;

                        return <span>{children}</span>;
                    }
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ children }) => // keep
                        (<span>{children}</span>);
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { children } = props;
                    return (
                    // keep
                        (<span>{children}</span>)
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ [getKey()]: value }) => <span>{value}</span>;
                `,
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: codeBlock`
                                    const Badge = (props) => {
                                    const { [getKey()]: value } = props;
                                    return (
                                    <span>{value}</span>
                                    );
                                    };
                                `,
                            },
                        ],
                    },
                ],
            },
            {
                code: codeBlock`
                    function Badge({ value }, ref = getRef()) {
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: codeBlock`
                                    function Badge(props, ref = getRef()) {
                                    const { value } = props;

                                        return <span>{value}</span>;
                                    }
                                `,
                            },
                        ],
                    },
                ],
            },
            {
                code: codeBlock`
                    function Badge({ value }, ref = value) {
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    function Badge({ value }) {
                        var value;
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    function Badge({ value }) {
                        function value() {}
                        return <span />;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    function Badge({ value }) {
                        return <span>{arguments[0].value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    function Badge({ value }) {
                        eval("value = 1");
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    function* Badge({ value }) {
                        yield 1;
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },
            {
                code: codeBlock`
                    async function Badge({ value }) {
                        return <span>{value}</span>;
                    }
                `,
                output: null,
                errors: [{ messageId: "destructureInBody", suggestions: [] }],
            },

            {
                code: codeBlock`
                    const Badge = ({ children }) => <span>{children}</span>;
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ children }) => {
                        return <span>{children}</span>;
                    };
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { children } = props;

                        return <span>{children}</span>;
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    function Badge({ children }) {
                        return <span>{children}</span>;
                    }
                `,
                output: codeBlock`
                    function Badge(props) {
                    const { children } = props;

                        return <span>{children}</span>;
                    }
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = function ({ children }) {
                        return <span>{children}</span>;
                    };
                `,
                output: codeBlock`
                    const Badge = function (props) {
                    const { children } = props;

                        return <span>{children}</span>;
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = function Named({ children }) {
                        return <span>{children}</span>;
                    };
                `,
                output: codeBlock`
                    const Badge = function Named(props) {
                    const { children } = props;

                        return <span>{children}</span>;
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ children }: Props) => <span>{children}</span>;
                `,
                output: codeBlock`
                    const Badge = (props: Props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = <T,>({ children }: Props<T>) => <span>{children}</span>;
                `,
                output: codeBlock`
                    const Badge = <T,>(props: Props<T>) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ children = "Default", ...rest }: Props) => (
                        <span {...rest}>{children}</span>
                    );
                `,
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: codeBlock`
                                    const Badge = (props: Props) => {
                                    const { children = "Default", ...rest } = props;
                                    return (
                                    (
                                        <span {...rest}>{children}</span>
                                    )
                                    );
                                    };
                                `,
                            },
                        ],
                    },
                ],
            },
            {
                code: codeBlock`
                    const Badge = ({ children } = {}) => <span>{children}</span>;
                `,
                output: null,
                errors: [
                    {
                        messageId: "destructureInBody",
                        suggestions: [
                            {
                                messageId: "reviewDestructureInBody",
                                output: codeBlock`
                                    const Badge = (props = {}) => {
                                    const { children } = props;
                                    return (
                                    <span>{children}</span>
                                    );
                                    };
                                `,
                            },
                        ],
                    },
                ],
            },
            {
                code: codeBlock`
                    const Badge = ({ label: title, ...rest }) => <span {...rest}>{title}</span>;
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { label: title, ...rest } = props;
                    return (
                    <span {...rest}>{title}</span>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ children }) => <>{children}</>;
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { children } = props;
                    return (
                    <>{children}</>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ visible }) => (visible ? <span /> : null);
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { visible } = props;
                    return (
                    (visible ? <span /> : null)
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ visible }) => visible && <span />;
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { visible } = props;
                    return (
                    visible && <span />
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = ({ visible }) => (<span />) as React.ReactNode;
                `,
                output: codeBlock`
                    const Badge = (props) => {
                    const { visible } = props;
                    return (
                    (<span />) as React.ReactNode
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    function Badge({ visible }) {
                        if (visible) {
                            return <span />;
                        }
                        return null;
                    }
                `,
                output: codeBlock`
                    function Badge(props) {
                    const { visible } = props;

                        if (visible) {
                            return <span />;
                        }
                        return null;
                    }
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    export default function ({ children }) {
                        return <span>{children}</span>;
                    }
                `,
                output: codeBlock`
                    export default function (props) {
                    const { children } = props;

                        return <span>{children}</span>;
                    }
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    export default ({ children }) => <span>{children}</span>;
                `,
                output: codeBlock`
                    export default (props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge: React.FC<Props> = ({ children }) => null;
                `,
                output: codeBlock`
                    const Badge: React.FC<Props> = (props) => {
                    const { children } = props;
                    return (
                    null
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge: React.FunctionComponent<Props> = ({ children }) => null;
                `,
                output: codeBlock`
                    const Badge: React.FunctionComponent<Props> = (props) => {
                    const { children } = props;
                    return (
                    null
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    import type { FC as Component } from "react";
                    const Badge: Component<Props> = ({ children }) => null;
                `,
                output: codeBlock`
                    import type { FC as Component } from "react";
                    const Badge: Component<Props> = (props) => {
                    const { children } = props;
                    return (
                    null
                    );
                    };
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = (
                        ({ children }) => <span>{children}</span>
                    ) satisfies React.FC<Props>;
                `,
                output: codeBlock`
                    const Badge = (
                        (props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    }
                    ) satisfies React.FC<Props>;
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = (({ children }) => <span>{children}</span>) as React.FC<Props>;
                `,
                output: codeBlock`
                    const Badge = ((props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    }) as React.FC<Props>;
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    import { memo } from "react";
                    const Badge = memo(({ children }) => <span>{children}</span>);
                `,
                output: codeBlock`
                    import { memo } from "react";
                    const Badge = memo((props) => {
                    const { children } = props;
                    return (
                    <span>{children}</span>
                    );
                    });
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = memoize(({ children }) => null);
                    import { memo as memoize } from "react";
                `,
                output: codeBlock`
                    const Badge = memoize((props) => {
                    const { children } = props;
                    return (
                    null
                    );
                    });
                    import { memo as memoize } from "react";
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    import { forwardRef } from "react";
                    const Badge = forwardRef(({ children }, ref) => (
                        <span ref={ref}>{children}</span>
                    ));
                `,
                output: codeBlock`
                    import { forwardRef } from "react";
                    const Badge = forwardRef((props, ref) => {
                    const { children } = props;
                    return (
                    (
                        <span ref={ref}>{children}</span>
                    )
                    );
                    });
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    import R from "react";
                    const Badge = R.forwardRef(({ children }, ref) => null);
                `,
                output: codeBlock`
                    import R from "react";
                    const Badge = R.forwardRef((props, ref) => {
                    const { children } = props;
                    return (
                    null
                    );
                    });
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    import * as R from "react";
                    const Badge = R.memo(({ children }) => null);
                `,
                output: codeBlock`
                    import * as R from "react";
                    const Badge = R.memo((props) => {
                    const { children } = props;
                    return (
                    null
                    );
                    });
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
            {
                code: codeBlock`
                    const Badge = React.memo(React.forwardRef(({ children }, ref) => <span />));
                `,
                output: codeBlock`
                    const Badge = React.memo(React.forwardRef((props, ref) => {
                    const { children } = props;
                    return (
                    <span />
                    );
                    }));
                `,
                errors: [{ messageId: "destructureInBody" }],
            },
        ],
    }
);
