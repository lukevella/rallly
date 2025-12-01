<!--
Sync Impact Report
==================
Version Change: Initial → 1.0.0
Modified Principles: N/A (initial constitution creation)
Added Sections:
  - Core Principles (5 principles defined)
  - Development Standards
  - Quality Assurance
  - Governance
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check gate verified
  ✅ spec-template.md - Requirements alignment verified
  ✅ tasks-template.md - Task categorization aligns with principles
Follow-up TODOs: None
-->

# Rallly Constitution

## Core Principles

### I. Composability & Simplicity

Code MUST favor composable components over monolithic implementations. Every feature MUST start with the simplest viable implementation following YAGNI (You Aren't Gonna Need It) principles. Complexity MUST be justified in writing before introduction.

**Rationale**: Composable components enable independent testing, reusability, and maintainability. Starting simple reduces cognitive load and technical debt. The project follows shadcn UI patterns where small, focused components combine to create complex UIs.

**Requirements**:
- Components MUST have minimal props - only essential information needed
- Prefer implicit return values over explicit returns where appropriate
- Break features into small, independently testable units
- Document justification for any complexity introduced

### II. Internationalization (i18n)

All user-facing text MUST be translatable using either the `Trans` component or `useTranslation` hook. Translation keys MUST be in camelCase. Client components MUST use `<Trans>` with the `defaults` prop. Server components MUST use `getTranslations()` from `@/i18n/server`.

**Rationale**: Rallly serves a global user base with translations managed through Crowdin. Consistent i18n patterns ensure all text is extractable and translatable without manual JSON editing.

**Requirements**:
- Client: `<Trans i18nKey="keyName" defaults="Default Text" />`
- Server: `const { t } = await getTranslations(); t("keyName", { defaultValue: "Default Text" });`
- i18nKeys describe the message in camelCase
- Component-specific keys MUST be prefixed with component name
- Use ICU message format for pluralization
- NEVER manually edit translation JSON files - use `pnpm i18n:scan`

### III. Type Safety & Validation

TypeScript MUST be used throughout with strict type checking enabled. Forms MUST use react-hook-form with Zod validation schemas. API contracts MUST use tRPC with proper type inference. Database schemas MUST use Prisma with generated types.

**Rationale**: Type safety catches errors at compile time, reduces runtime bugs, and provides self-documenting code. The tRPC + Prisma stack ensures end-to-end type safety from database to UI.

**Requirements**:
- Separate import statements for types
- Use Zod for all form validation
- Use tRPC for all API endpoints
- Run `pnpm type-check` before commits
- Do NOT attempt to fix TypeScript issues related to missing i18n keys - run `pnpm i18n:scan`

### IV. Testing & Quality Assurance

Features MUST include both unit tests (Vitest) and integration tests (Playwright) as appropriate. Tests MUST be written before implementation for critical paths. All code MUST pass Biome linting and formatting checks before commit.

**Rationale**: Testing ensures reliability and prevents regressions. Playwright integration tests verify end-user workflows. Biome provides fast, consistent code quality checks across the monorepo.

**Requirements**:
- Unit tests: `pnpm test:unit` for business logic
- Integration tests: `pnpm test:integration` for user workflows
- Linting: `pnpm check:fix` before commits
- Type checking: `pnpm type-check` before commits
- Test files co-located with source code

### V. Modern UI Standards

Styling MUST use TailwindCSS with the `cn()` utility from `@rallly/ui` for class composition. Icons MUST be wrapped with the `<Icon>` component for consistent sizing and coloring. Dialog state MUST use the `useDialog` hook instead of manual `useState`. Date handling MUST use dayjs.

**Rationale**: TailwindCSS provides utility-first styling with design system consistency. Standardized patterns for icons, dialogs, and dates reduce inconsistencies and improve developer experience.

**Requirements**:
- Use `cn()` from `@rallly/ui` to compose classes
- Wrap icons with `<Icon>` component from `@rallly/ui/icon`
- Use `useDialog` hook for all dialog state management
- Use dayjs for all date operations
- Prefer React module APIs (e.g., `React.useState`) over standalone hooks
- Add "use client" directive to files requiring client-side JavaScript

## Development Standards

**Package Management**: MUST use pnpm for all dependency management.

**Monorepo Structure**:
- `apps/web/` - Main Next.js application
- `apps/landing/` - Marketing site
- `apps/docs/` - Documentation
- `packages/` - Shared packages (ui, database, emails, billing, utils)

**File Naming**: MUST use kebab-case for all file names.

**String Formatting**: MUST use double quotes for strings.

**Comments**: MUST only add comments when code is not self-explanatory.

**shadcn-ui Components**: MUST be added to `packages/ui`.

**Feature Organization**: Features MUST be organized in `apps/web/src/features/[feature]/` with shared components in `apps/web/src/components/`.

## Quality Assurance

**Pre-Commit Checks**:
1. Run `pnpm check:fix` to auto-fix linting issues
2. Run `pnpm type-check` to verify TypeScript types
3. Run relevant unit tests for changed code
4. Verify i18n keys are present (run `pnpm i18n:scan` if needed)

**Code Review Requirements**:
- All changes MUST pass CI checks (linting, type-checking, tests)
- New features MUST include appropriate tests
- UI changes MUST include i18n support
- Components MUST follow composability principles

**Database Changes**:
- Schema changes MUST use Prisma migrations
- Development: `pnpm db:migrate`
- Production: `pnpm db:deploy`
- MUST run `pnpm db:generate` after schema changes

## Governance

**Constitutional Authority**: This constitution supersedes conflicting practices. When project conventions conflict with external conventions, this constitution takes precedence.

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Impact analysis MUST identify affected templates and code
3. Version MUST be incremented following semantic versioning:
   - MAJOR: Backward incompatible governance/principle removals or redefinitions
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording refinements, non-semantic changes
4. All dependent templates MUST be updated for consistency
5. Migration plan MUST be provided for breaking changes

**Compliance Review**:
- All feature specifications MUST verify constitution compliance
- Plan documents MUST include "Constitution Check" gate
- Complexity introductions MUST be justified against Principle I (Simplicity)
- All PRs MUST verify adherence to these principles

**Runtime Guidance**: Developers SHOULD reference `CLAUDE.md` for detailed development commands, architecture overview, and practical examples of applying these principles.

**Version**: 1.0.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
