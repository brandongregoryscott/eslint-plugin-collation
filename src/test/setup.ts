/* @ts-ignore */
import * as matchers from "jest-extended";
import { toHaveErrors, toMatchSourceFile } from "./matchers";

expect.extend(matchers);
expect.extend({ toHaveErrors, toMatchSourceFile });
