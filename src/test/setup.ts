/* @ts-ignore */
import * as matchers from "jest-extended";
import { toHaveErrors, toMatchSourceFile } from "./matchers";

jest.setTimeout(10000);

expect.extend(matchers);
expect.extend({ toHaveErrors, toMatchSourceFile });
