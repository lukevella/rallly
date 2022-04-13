<img src="./public/logo.png" width="200"  />

[![Actions Status](https://github.com/lukevella/rallly/workflows/ci/badge.svg)](https://github.com/lukevella/rallly/actions)

Rallly is a free group meeting scheduling tool – built with [Next.js](https://github.com/vercel/next.js/), [Prisma](https://github.com/prisma/prisma) & [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)

## 🐳 Quickstart with docker

_For running in a production environment_

Clone this repo and change directory to the root of the repository.

```bash
git clone https://github.com/lukevella/Rallly.git
cd Rallly
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
git clone https://github.com/lukevella/Rallly.git
cd Rallly
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

<a href="https://vercel.com/?utm_source=rallly&utm_campaign=oss">![Powered by Vercel](/public/powered-by-vercel.svg)</a>
