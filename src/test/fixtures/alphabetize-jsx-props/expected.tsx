import _ from "lodash";
import React from "react";

interface ExampleProps {}

const Example: React.FC<ExampleProps> = (props: ExampleProps) => {
    return (
        <div onAbort={_.noop} onClick={_.noop} onWaiting={_.noop}>
            <button
                disabled={true}
                onClick={_.noop}
                suppressContentEditableWarning={true}></button>
        </div>
    );
};

export { Example };
