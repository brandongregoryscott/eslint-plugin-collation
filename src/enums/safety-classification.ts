const SafetyClassification = {
    Blocked: "blocked",
    Review: "review",
    Safe: "safe",
} as const;

type SafetyClassification =
    typeof SafetyClassification[keyof typeof SafetyClassification];

export { SafetyClassification };
