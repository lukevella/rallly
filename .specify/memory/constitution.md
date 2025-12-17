<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (new document)
Added sections: Core Principles (7), Code Quality Standards, Development Workflow, Governance
Templates requiring updates:
  ✅ spec-template.md (aligned with testing requirements)
  ✅ tasks-template.md (aligned with quality gates)
  ⚠️ plan-template.md (may need review for performance/observability requirements)
  ⚠️ checklist-template.md (may need review for i18n/component patterns)
Follow-up TODOs: RATIFICATION_DATE to be confirmed with project maintainers
-->

# Rallly Constitution

## Core Principles

### I. Code Quality & Consistency (NON-NEGOTIABLE)

All code MUST adhere to Biome formatting and linting rules. Code quality checks are mandatory in CI and must pass before any merge. Formatting standards include: 2-space indentation, 80-character line width, double quotes, trailing commas, semicolons, and type imports using separate `import type` statements. Tailwind classes MUST be sorted using `cn()`, `clsx()`, `cva()`, or `tw()` functions. Unused imports and inferrable types are errors. Self-closing JSX elements are required.

**Rationale**: Consistent code formatting reduces cognitive load, prevents style debates, and enables automated tooling to enforce standards. Biome provides fast, comprehensive linting that replaces the need for separate ESLint and Prettier configuration.

### II. Type Safety & TypeScript Strictness

Full TypeScript coverage is required. The `any` type is prohibited unless absolutely necessary and justified. Type checking runs in CI and MUST pass. Separate type imports are mandatory: `import type { ... }` for types vs `import { ... }` for values. All code MUST compile without type errors.

**Rationale**: Type safety prevents runtime errors, improves developer experience through better IDE support, and enables confident refactoring. TypeScript strict mode catches potential bugs at compile time.

### III. Testing Requirements

All user-facing features MUST have integration tests using Playwright. Unit tests using Vitest are required for complex logic and utilities. Tests MUST be deterministic, isolated, and maintainable. Integration tests run against a production build. Database cleanup MUST use transactions/rollbacks. Email testing uses Mailpit (not real email sending). Both unit and integration tests MUST pass in CI before merge.

**Rationale**: Integration tests verify end-to-end user workflows work correctly. Unit tests ensure individual functions behave as expected. Together, they provide confidence in code changes and prevent regressions.

### IV. Component Design & UX Consistency

Components MUST follow composable patterns in the style of shadcn UI. Props MUST be minimal—only pass essential data. Icons MUST be wrapped in the `<Icon>` component from `@rallly/ui/icon` (never apply size/color directly). Class composition MUST use `cn()` from `@rallly/ui`. Components MUST be reusable across applications. File names MUST use kebab-case. Components SHOULD prefer implicit returns over explicit returns. React module APIs (e.g., `React.useState`) are preferred over standalone hooks.

**Rationale**: Composable components reduce duplication, improve maintainability, and ensure consistent UI/UX. Minimal props reduce coupling and make components easier to understand and test.

### V. Internationalization (i18n) Requirements

ALL UI text MUST be translatable using either the `<Trans>` component (client) or `getTranslations()` function (server). i18n keys MUST use camelCase. Component-specific keys MUST be prefixed with the component name. Translations MUST NEVER be manually added to `.json` files (handled by tooling). The `i18n:scan` command MUST be used to generate translation keys.

**Rationale**: Rallly supports multiple languages through Crowdin. All user-facing text must be translatable to maintain this capability. Automated tooling prevents missing translations and keeps the codebase maintainable.

### VI. Performance & Observability Standards

Performance monitoring via Sentry (20% trace sample rate) and PostHog analytics is required. Bundle size MUST be monitored (bundle analyzer available). Database queries MUST be optimized with proper indexes. React Server Components MUST be used where possible; client components only when needed (with `"use client"` directive). Efficient queries with selective field loading are required. Error boundaries MUST be implemented where appropriate.

**Rationale**: Performance directly impacts user experience. Monitoring provides visibility into production issues. Optimized queries and proper component architecture ensure fast page loads and responsive interactions.

### VII. Code Review & Quality Gates

Before submitting a PR, the following MUST pass: `pnpm check` (linting), `pnpm type-check` (TypeScript), `pnpm test:unit` (unit tests), `pnpm test:integration` (integration tests if applicable). Code reviews MUST verify: adherence to Biome rules, TypeScript type safety, i18n implementation, component patterns, appropriate test coverage, and no performance regressions. All text MUST be translatable. File names MUST use kebab-case.

**Rationale**: Quality gates prevent broken code from entering the codebase. Code reviews ensure consistency, catch issues early, and share knowledge across the team.

## Technology Stack Requirements

### Required Tools & Frameworks

- **Package Manager**: pnpm (strict requirement; no npm/yarn)
- **Date Handling**: dayjs (not moment.js, date-fns, or native Date)
- **Styling**: TailwindCSS with utility-first approach
- **State Management**: TanStack Query (React Query) for server state, React Context for client state
- **Form Handling**: react-hook-form with Zod validation
- **Testing**: Vitest for unit tests, Playwright for integration tests
- **Code Quality**: Biome for linting/formatting, TypeScript for type checking
- **Dependency Validation**: Sherif (runs in CI)

### Framework Constraints

- Next.js App Router with React Server Components preferred
- tRPC for type-safe API layer
- Prisma ORM for database access
- React 19+ features where available

## Development Workflow

### Pre-Commit Requirements

Before committing code, developers MUST ensure:
1. `pnpm check` passes (no linting errors)
2. `pnpm type-check` passes (no TypeScript errors)
3. Tests pass locally (unit and integration as applicable)
4. All new UI text uses i18n (`Trans` or `getTranslations`)
5. File names follow kebab-case convention

### CI/CD Pipeline

The CI pipeline enforces the following checks (all MUST pass):
1. Type checking (`pnpm type-check`)
2. Linting (`pnpm check` via Biome)
3. Dependency validation (`pnpm sherif`)
4. Unit tests (`pnpm test:unit`)
5. Integration tests (`pnpm test:integration`)

Build caching is enabled via Turbo. Integration tests run against a production build to catch build-time issues.

### Code Review Process

All PRs require review. Reviewers MUST verify:
- Code quality standards adherence
- TypeScript type safety
- i18n implementation correctness
- Component design patterns (composable, minimal props)
- Appropriate test coverage
- No obvious performance regressions
- Proper error handling

## Governance

This constitution supersedes all other coding standards and practices. Amendments require:
1. Documentation of the proposed change and rationale
2. Review and approval by project maintainers
3. Update to this document with version increment
4. Propagation to dependent templates and documentation

**Version Control**: Constitution versions follow semantic versioning:
- **MAJOR**: Backward incompatible principle changes or removals
- **MINOR**: New principles added or existing ones materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes

**Compliance**: All PRs and code reviews MUST verify compliance with this constitution. Complexity and exceptions MUST be justified. For runtime development guidance, refer to `CLAUDE.md` and `.cursorrules`.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Confirm with project maintainers | **Last Amended**: 2025-01-17