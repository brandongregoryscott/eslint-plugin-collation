import tsEslint from "typescript-eslint";
import { RuleTester } from "../test/test-utils";
import { noInlineEventHandler } from "./no-inline-event-handler";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
    },
});

ruleTester.run("no-inline-event-handler", noInlineEventHandler, {
    valid: [
        `<button onClick={handleClick} />`,
        `<Button onClick={props.onClick} />`,
        `<form onSubmit={form.handleSubmit(handleSubmit)} />`,
        `<Widget renderItem={(item) => <span>{item}</span>} />`,
        `<input ref={(element) => { input = element; }} />`,
        `<div onClick={undefined} />`,
        `<div onClick />`,
        `<div on:click={() => run()} />`,
        `<div onclick={() => run()} />`,
        `<button onClick={handleClick as Handler} />`,
    ],
    invalid: [
        {
            code: `<button onClick={() => run()} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<form onSubmit={function (event) { event.preventDefault(); }} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<Button onClick={async () => { await save(); }} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<Dialog.Root onOpenChange={({ open }) => setOpen(open)} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<Button onClick={(() => run()) as Handler} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<Button onClick={(() => run()) satisfies Handler} />`,
            errors: [{ messageId: "extractHandler" }],
        },
        {
            code: `<Button onClick={handler.bind(this)} />`,
            errors: [{ messageId: "extractHandler" }],
        },
    ],
});
