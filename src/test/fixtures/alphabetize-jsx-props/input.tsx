import _ from "lodash";
import React from "react";

interface ExampleProps {}

const Example: React.FC<ExampleProps> = (props: ExampleProps) => {
    return (
        <div onWaiting={_.noop} onClick={_.noop} onAbort={_.noop}>
            <button
                suppressContentEditableWarning={true}
                onClick={_.noop}
                disabled={true}></button>
        </div>
    );
};

export { Example };
