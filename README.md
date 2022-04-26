[![Actions Status](https://github.com/lukevella/rallly/workflows/ci/badge.svg)](https://github.com/lukevella/rallly/actions)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-orange.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E)


![hero](./docs/images/hero-image.png)

Rallly is a free group meeting scheduling tool – built with [Next.js](https://github.com/vercel/next.js/), [Prisma](https://github.com/prisma/prisma) & [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)

## 🐳 Quickstart with docker

_For running in a production environment_

Clone this repo and change directory to the root of the repository.

```bash
git clone https://github.com/lukevella/rallly.git
cd rallly
```

_optional_: Configure your SMTP server. Without this, Rallly won't be able to send out emails. You can set the following environment variables in a `.env` in the root of the project

```
# support email - used as FROM email by SMTP server
SUPPORT_EMAIL=foo@yourdomain.com
# SMTP server - required if you want to send emails
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER=your-smtp-user
SMTP_PWD=your-smtp-password
```

Build and run with `docker-compose`

```bash
docker-compose up -d
```

Go to [http://localhost:3000](http://localhost:3000)

## 💻 Running locally

Clone this repo and change directory to the root of the repository.

```bash
git clone https://github.com/lukevella/rallly.git
cd rallly
```

Copy the sample `.env` file then open it and set the variables.

```bash
cp sample.env .env
```

Fill in the required environment variables.

```
# postgres database - not needed if running with docker-compose
DATABASE_URL=postgres://your-database/db
# support email - used as FROM email by SMTP server
SUPPORT_EMAIL=foo@yourdomain.com
# SMTP server - required if you want to send emails
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER=your-smtp-user
SMTP_PWD=your-smtp-password
```

Install dependencies

```
yarn
```

Next we need to run the database migrations to create our tables

```
yarn prisma migrate deploy
```

Start the Next.js server

```
# For development
yarn dev
# For production
yarn build
yarn start
```

## 👨‍💻 Contributors

If you would like to contribute to the development of the project please reach out first before spending significant time on it.

## 👮‍♂️ License

Rallly is open-source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version. See [LICENSE](LICENSE) for more detail.

## 🙏 Sponsors

These companies have graciously offered their services in support of this project.

<a href="https://vercel.com/?utm_source=rallly&utm_campaign=oss"><img src="public/vercel-logotype-dark.svg" alt="Powered by Vercel" height="30" /></a>
&nbsp;&nbsp;&nbsp;
<a href="https://m.do.co/c/f91efc9c9e50"><img src="public/digitalocean.svg" alt="Sentry" height="30" /></a>
&nbsp;&nbsp;&nbsp;
<a href="https://sentry.io"><img src="public/sentry.svg" alt="Sentry" height="30" /></a>
