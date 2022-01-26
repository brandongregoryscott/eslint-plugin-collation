const isForgottenNodeError = (error: any): error is Error =>
    error instanceof Error && error.message.includes("removed or forgotten");

export { isForgottenNodeError };
