<div align="center">
  
<img src="./assets/images/logo-color.svg" width="200px" alt="Rallly" />

</div>
<br />
<div align="center">
  
[![Actions Status](https://github.com/lukevella/rallly/workflows/CI/badge.svg?branch=main)](https://github.com/lukevella/rallly/actions)
[![Crowdin](https://badges.crowdin.net/rallly/localized.svg)](https://crowdin.com/project/rallly)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-orange.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/badge/-Join%20Chat-7289DA?logo=discord&logoColor=white)](https://discord.gg/uzg4ZcHbuM)
[![Donate](https://img.shields.io/badge/-Donate%20with%20Paypal-white?logo=paypal)](https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E)

</div>

<img src="./assets/images/splash.png" alt="Rallly" />

Schedule group meetings with friends, colleagues and teams. Create meeting polls to find the best date and time to organize an event based on your participants' availability. Save time and avoid back-and-forth emails.

Built with [Next.js](https://github.com/vercel/next.js/), [Prisma](https://github.com/prisma/prisma), [tRPC](https://github.com/trpc/trpc) & [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)

## Self-hosting

Check out the [self-hosting docs](https://support.rallly.co/self-hosting) for more information on running your own instance of Rallly.

## Get started

1. Clone the repository switch to the project directory

   ```bash
   git clone https://github.com/lukevella/rallly.git
   cd rallly
   ```

2. Install dependencies

   ```
   yarn
   ```

3. Setup environment variables

   ```bash
   cp sample.env .env
   ```

   Create a `.env` file by copying `sample.env` then open it and set the required [configuration options](https://support.rallly.co/self-hosting/configuration-options).

4. Setup the database

   If you don't have a postgres database running locally, you can spin up a new database using docker by running:

   ```
   yarn dx
   ```

   If you already have a postgres database, you can run the migrations and seed the database by running:

   ```
   yarn db:setup
   ```

   This will:

   - run migrations to create the database schema
   - seed the database with test users and random data

5. Start the Next.js server

   ```
   yarn dev
   ```

## Contributors

Please read our [contributing guide](CONTRIBUTING.md) to learn about how to contribute to this project.

### Translators 🌐

You can help translate Rallly to another language by following our [guide for translators](https://support.rallly.co/contribute/translations).

## License

Rallly is open-source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version. See [LICENSE](LICENSE) for more detail.

## Sponsors

Thank you to our sponsors for making this project possible.

<a href="https://github.com/cpnielsen" target="_blank"><img src="https://avatars.githubusercontent.com/u/1258576?v=4" width="48" height="48" /></a>&nbsp;
<a href="https://github.com/iamericfletcher" target="_blank"><img src="https://avatars.githubusercontent.com/u/64165327?v=4" width="48" height="48" /></a>&nbsp;
<a href="https://github.com/arcticFox-git" target="_blank"><img src="https://avatars.githubusercontent.com/u/86988982?v=4" width="48" height="48" /></a>&nbsp;
<a href="https://github.com/zakwear" target="_blank"><img src="https://avatars.githubusercontent.com/u/55545774?v=4" width="48" height="48" /></a>&nbsp;
<a href="https://github.com/jonnymarshall" target="_blank"><img src="https://avatars.githubusercontent.com/u/42963069?v=4" width="48" height="48" /></a>&nbsp;
<a href="https://github.com/maximelouet" target="_blank"><img src="https://avatars.githubusercontent.com/u/8074940?v=4" width="48" height="48" /></a>&nbsp;

[Become a sponsor &rarr;](https://github.com/sponsors/lukevella)

And thank you to these companies for sponsoring and showing support for this project.

<p>
<a href="https://appwrite.io?utm_source=rallly"><img src="./assets/images/appwrite.svg" alt="appwrite" height="24" /></a>&nbsp;&nbsp;&nbsp;<!--
--><a href="https://vercel.com/?utm_source=rallly&utm_campaign=oss"><img src="./assets/images/vercel-logotype-dark.svg#gh-light-mode-only" alt="Powered by Vercel" height="24" /></a>&nbsp;&nbsp;&nbsp;<!--
--><a href="https://ura.design?utm_source=rallly"><img height="24" alt="Ura Design" src="./assets/images/ura-logo-blue.svg"></a>
</p>
<p>
<a href="https://m.do.co/c/f91efc9c9e50"><img src="./apps/landing/public/digitalocean.svg" alt="Digital Ocean" height="24" /></a>&nbsp;&nbsp;&nbsp;<!--
--><a href="https://sentry.io?utm_source=rallly"><img src="./apps/landing/public/sentry.svg" alt="Sentry" height="24" /></a>&nbsp;&nbsp;&nbsp;<!--
--><a href="https://cloudron.io?utm_source=rallly"><img src="./assets/images/cloudron-logo.svg" alt="Cloudron" height="30"></a>&nbsp;&nbsp;&nbsp;<!--
--><a href="https://featurebase.app?utm_source=rallly"><img src="./assets/images/featurebase.svg" alt="Featurebase" height="28"></a>
</p>
