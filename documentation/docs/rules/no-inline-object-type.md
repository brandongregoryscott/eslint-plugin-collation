# No Inline Object Type

## Name

`no-inline-object-type`

## Description

Enforces extracting inline object types from function parameters and return types into named type aliases.

This rule helps improve code readability by extracting inline object types into named type aliases, making the function signatures cleaner and the types reusable.

## Options

### `parameterTypeNamePattern`

Pattern for the generated type name for inline parameter types. Supports the following placeholders:

-   `{{functionName}}` - The function name as-is
-   `{{upperFirstFunctionName}}` - The function name with the first letter capitalized
-   `{{paramName}}` - The parameter name as-is
-   `{{upperFirstParamName}}` - The parameter name with the first letter capitalized

**Default:** `"{{upperFirstFunctionName}}{{upperFirstParamName}}"`

### `returnTypeNamePattern`

Pattern for the generated type name for inline return types. Supports `{{functionName}}` and `{{upperFirstFunctionName}}` placeholders.

**Default:** `"{{upperFirstFunctionName}}Result"`

### Example with custom patterns

```json
{
    "collation/no-inline-object-type": [
        "warn",
        {
            "parameterTypeNamePattern": "{{upperFirstFunctionName}}{{upperFirstParamName}}Type",
            "returnTypeNamePattern": "{{functionName}}Output"
        }
    ]
}
```

With this configuration:

```ts
function myFunction(userData: { id: string }): { result: boolean } {
    return { result: true };
}
```

will be transformed to:

```ts
type MyFunctionUserDataType = { id: string };
type myFunctionOutput = { result: boolean };

function myFunction(userData: MyFunctionUserDataType): myFunctionOutput {
    return { result: true };
}
```

## Examples

### Function parameter

```ts
function foo(options: { id: string; otherId?: string }) {}
```

will be transformed to:

```ts
type FooOptions = {
    id: string;
    otherId?: string;
};

function foo(options: FooOptions) {}
```

### Function return type

```ts
function foo(input: string): { id: string; otherId?: string } {
    return { id: input };
}
```

will be transformed to:

```ts
type FooResult = {
    id: string;
    otherId?: string;
};

function foo(input: string): FooResult {
    return { id: input };
}
```

### Arrow functions

```ts
const foo = (options: { id: string }) => {};
```

will be transformed to:

```ts
type FooOptions = { id: string };

const foo = (options: FooOptions) => {};
```

### Class methods

```ts
class MyClass {
    doSomething(options: { id: string }) {}
}
```

will be transformed to:

```ts
type DoSomethingOptions = { id: string };

class MyClass {
    doSomething(options: DoSomethingOptions) {}
}
```

### Multiple parameters

When a function has multiple parameters with inline object types, each gets a unique type name based on the parameter name:

```ts
function foo(options: { id: string }, config: { enabled: boolean }) {}
```

will be transformed to:

```ts
type FooOptions = { id: string };
type FooConfig = { enabled: boolean };

function foo(options: FooOptions, config: FooConfig) {}
```

## Notes

-   The rule only processes functions/methods where a name can be determined. Anonymous functions passed directly as callbacks without a variable assignment will be skipped.
-   When a function has multiple inline object types (e.g., multiple parameters or both parameter and return type), each will be extracted separately. Running `eslint --fix` multiple times may be needed to fix all issues.
-   The generated type is inserted directly above the statement containing the function.
-   Using the parameter name in the type pattern (via `{{paramName}}` or `{{upperFirstParamName}}`) ensures unique type names when multiple parameters have inline object types.
