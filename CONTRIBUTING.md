# Contributing Guide

Contributions are welcome from anyone who is interested in improving this project and there are multiple ways in which you can contribute.

## Code 🧑‍💻

Have a look at the [open issues](https://github.com/lukevella/rallly/issues) and look for issues that are labeled with `help wanted` or `good first issue`. If you find an issue that you would like to work on, please leave a comment on the issue to let us know.

If there isn't an issue for the work that you would like to contribute, start by opening a [discussion](https://github.com/lukevella/rallly/discussions/new/choose) to discuss the changes that you would like to make.

In order to maintain a high standard of code quality, please ensure that you are familiar with the technology stack used in this project where it applies to your code. The technology stack used in this project is:

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [tRPC](https://trpc.io/)
- [Prisma](https://www.prisma.io/)

## Local development 🧑‍🔧

The following instructions are for running the project locally for development.

1. Clone the repository and switch to the project directory

   ```bash
   git clone https://github.com/lukevella/rallly.git
   cd rallly
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Setup environment variables

   Copy the sample environment file and fill in the required values:

   ```bash
   cp apps/web/.env.sample apps/web/.env
   cp packages/database/.env.sample packages/database/.env
   ```

   See [configuration options](https://support.rallly.co/self-hosting/configuration-options) for a full list of available options.

4. Generate Prisma client

   ```bash
   pnpm db:generate
   ```

5. Setup database

   You will need to have [Docker](https://docs.docker.com/get-docker/) installed and running to run the database using the provided docker-compose file.

   To start the database, run:

   ```bash
   pnpm docker:up
   ```

   Next run the following command to setup the database:

   ```bash
   pnpm db:reset && pnpm db:seed
   ```

   This will:

   - delete the existing database (if it exists)
   - run migrations to create a new database schema
   - seed the database with test users and random data

6. Start the portless proxy

   The dev scripts route the apps through [portless](https://portless.sh), which exposes them at stable HTTPS URLs (e.g. `https://web.rallly.test`) instead of `localhost:<port>`.

   Start the proxy:

   ```bash
   pnpm proxy:start
   ```

7. Start the Next.js server

   ```bash
   pnpm dev
   ```

   By default the app is served at `https://web.rallly.test`. To run it at a different domain (e.g. to run multiple dev servers from separate worktrees at the same time), set `DEV_DOMAIN` to the full domain you want:

   ```bash
   DEV_DOMAIN=web-myfeature.rallly.test pnpm dev
   ```

   This registers the domain with portless, allows it as a dev origin in Next.js, and overrides `NEXT_PUBLIC_BASE_URL` so links, assets, and auth callbacks point at the right host. Note that `DEV_DOMAIN` must be set in your shell — setting it in `.env` has no effect because the dev script reads it before Next.js loads env files.

## Translations 🌐

To contribute translations, please check out our [guide for translators](https://support.rallly.co/contribute/translations) which contains all the information you need to get started.

## Becoming a Sponsor 💰

If you find this project useful and would like to contribute financially on an ongoing basis, please consider becoming a sponsor. Sponsors help us cover the costs of hosting, development, and maintenance, and enable us to continue working on the project.

To become a sponsor, visit our [sponsor page](https://github.com/sponsors/lukevella) and select the sponsorship level that works for you.

Donations are also accepted through [PayPal](http://paypal.me/ralllyco).

## Documentation

To contribute documentation please check out the [contributing guide](https://support.rallly.co/contribute/documentation) which contains all the information you need to get started.

## Code of Conduct 👮‍♀️

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## License 👩‍⚖️

By contributing to this project, you agree that your contributions will be licensed under the [AGPL-3.0 license](LICENSE).

Thank you for your interest in contributing to this project!
