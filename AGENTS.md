# AGENTS.md

## Cursor Cloud specific instructions

Standard dev commands (install, db, lint, test, build, run) live in `CLAUDE.md` and `package.json`.
The notes below only cover non-obvious cloud-environment caveats.

### Node / pnpm
- The repo requires **Node 24** and has `engine-strict=true` (in `.npmrc`), so `pnpm install` fails on
  other Node versions. Node 24 is installed via `nvm` and symlinked into `/usr/local/cargo/bin`
  (`node`/`npm`/`npx`/`corepack`) so it wins over the daemon's bundled Node. `pnpm` is provided by
  corepack (pinned to the `packageManager` field). These persist in the VM snapshot; the update script
  only runs `pnpm install` + `pnpm db:generate`.

### Docker / dev services
- There is **no systemd** in this VM. Start the Docker daemon manually before using compose:
  `sudo dockerd &` (logs to your terminal), then `sudo chmod 666 /var/run/docker.sock` if you hit
  permission errors. The daemon is configured for `fuse-overlayfs` + `iptables-legacy` (required here).
- Start backing services with `pnpm docker:up` (Postgres on `5450`, Mailpit on `1025`/UI `8025`,
  Redis, Garage). These are NOT started by the update script.

### Database
- Do **not** use `pnpm db:reset` — Prisma 7 blocks AI agents from running `migrate reset` and it is
  destructive. On a fresh DB use `pnpm db:deploy` (applies migrations) followed by `pnpm db:seed`
  (loads sample data), which is equivalent and non-destructive.

### Env files
- `apps/web/.env` and `packages/database/.env` are gitignored. Copy from the `.env.sample` files.
  `SECRET_PASSWORD` must be at least 32 chars. For cloud use, set `NEXT_PUBLIC_BASE_URL=http://localhost:3000`.

### Running the web app
- The default `pnpm dev` script runs `portless web.rallly next dev`, which serves the app over
  `https://web.rallly.test` and needs the portless proxy + a trusted CA. In the cloud it is simpler to
  run Next directly on localhost: `cd apps/web && PORT=3000 pnpm exec next dev` (with
  `NEXT_PUBLIC_BASE_URL=http://localhost:3000` in `apps/web/.env`).

### Auth / testing
- Login is **email OTP** (no passwords). The verification email is captured by the local Mailpit
  instance — read the 6-digit code from its web UI at http://localhost:8025. Seeded user: `dev@rallly.co`.
