module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests-toth-dorian"],
  testMatch: ["**/*.test.ts"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/apps/web/src/$1",
  },
};
