# No Inline Event Handler

`collation/no-inline-event-handler` requires handlers for JSX `onX` props to be declared before the JSX. It catches inline arrow functions, function expressions, and `.bind()` calls, including expressions wrapped in TypeScript casts. Named handlers, forwarded props, and named form-handler factories remain valid.

```tsx
const handleSave = () => save(value);

return <Button onClick={handleSave} />;
```

The following is reported:

```tsx
return <Button onClick={() => save(value)} />;
```

This rule has no options or automatic fixes. Moving a handler can change its closure, scope, or evaluation, so extraction requires review. Render props and ref callbacks are outside its scope. Handler naming and explicit boolean props are separate policies.
