import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

RuleTester.it = it;
RuleTester.describe = describe;
RuleTester.afterAll = afterAll;

export { RuleTester };
