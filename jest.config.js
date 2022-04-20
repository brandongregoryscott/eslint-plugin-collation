module.exports = {
    globals: {
        "ts-jest": {
            diagnostics: false,
            tsconfig: "<rootDir>/tsconfig.json",
        },
    },
    clearMocks: true,
    modulePathIgnorePatterns: ["<rootDir>/dist"],
    preset: "ts-jest",
    restoreMocks: true,
    setupFilesAfterEnv: ["./src/test/setup.ts"],
    testEnvironment: "node",
    silent: false,
};
