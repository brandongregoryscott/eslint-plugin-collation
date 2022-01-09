---
sidebar_position: 1
---

# Rules

This project implements various different rules to make your code more consistent and easier to read - similar to tools like `ESLint`, with the idea that **all rules should be fixable without intervention**.

Rules are custom functions that implement a common interface, [`RuleFunction`](../../../src/types/rule-function.ts), and return a [`RuleResult`](../../../src/interfaces/rule-result.ts) containing any errors and a diff of the changes.
