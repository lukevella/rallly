[![Actions Status](https://github.com/lukevella/rallly/workflows/ci/badge.svg)](https://github.com/lukevella/rallly/actions)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-orange.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/badge/-Join%20Chat-7289DA?logo=discord&logoColor=white)](https://discord.gg/m5UFXavc2C)
[![Donate](https://img.shields.io/badge/-Donate%20with%20Paypal-white?logo=paypal)](https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E)

![hero](./docs/images/hero-image.png)

Self-hostable doodle poll alternative. Find the best date for a meeting with your colleagues or friends without the back and forth emails.

Built with [Next.js](https://github.com/vercel/next.js/), [Prisma](https://github.com/prisma/prisma), [tRPC](https://github.com/trpc/trpc) & [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)

## 🐳 Quickstart with docker

_For running in a production environment_

Clone this repo and change directory to the root of the repository.

```bash
git clone https://github.com/lukevella/rallly.git
cd rallly
```

Once inside the directory create a `.env` file where you can set your environment variables. There is a `sample.env` that you can use as a reference.

```bash
cp sample.env .env
```

_See [configuration](#%EF%B8%8F-configuration) to see what parameters are availble._

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

_See [configuration](#%EF%B8%8F-configuration) to see what parameters are availble._

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

## ⚙️ Configuration

| Parameter            | Default                                        | Description                                                                                                                         |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL | http://localhost:3000                          | The hosting url of the server, used for creating links and making api calls from the client.                                        |
| DATABASE_URL         | postgres://postgres:postgres@rallly_db:5432/db | A postgres database URL. Leave out if using the docker-compose file since it will spin up and connect to its own database instance. |
| SECRET_PASSWORD      | -                                              | A long string (minimum 32 characters) that is used to encrypt session data.                                                         |
| SUPPORT_EMAIL        | -                                              | An email address that will appear as the FROM email for all emails being sent out.                                                  |
| SMTP_HOST            | -                                              | Host name of your SMTP server                                                                                                       |
| SMTP_PORT            | -                                              | Port of your SMTP server                                                                                                            |
| SMTP_SECURE          | false                                          | Set to "true" if SSL is enabled for your SMTP connection                                                                            |
| SMTP_USER            | -                                              | Username to use for your SMTP connection                                                                                            |
| SMTP_PWD             | -                                              | Password to use for your SMTP connection                                                                                            |

## 👨‍💻 Contributors

If you would like to contribute to the development of the project please reach out first before spending significant time on it.

## 👮‍♂️ License

Rallly is open-source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version. See [LICENSE](LICENSE) for more detail.

## 🙏 Sponsors

Big thanks to these folks for sponsoring the project!

<a href="https://github.com/cpnielsen" target="_blank"><img src="https://avatars.githubusercontent.com/u/1258576?v=4" width="32" height="32" /></a>&nbsp;
<a href="https://github.com/Daedalus3" target="_blank"><img src="https://avatars.githubusercontent.com/u/5649239?v=4" width="32" height="32" /></a>&nbsp;
<a href="https://github.com/iamericfletcher" target="_blank"><img src="https://avatars.githubusercontent.com/u/64165327?v=4" width="32" height="32" /></a>&nbsp;

And thanks to these companies for providing their services to host and run [rallly.co](https://rallly.co).

<a href="https://vercel.com/?utm_source=rallly&utm_campaign=oss"><img src="public/vercel-logotype-dark.svg" alt="Powered by Vercel" height="30" /></a>
&nbsp;&nbsp;&nbsp;
<a href="https://m.do.co/c/f91efc9c9e50"><img src="public/digitalocean.svg" alt="Digital Ocean" height="30" /></a>
&nbsp;&nbsp;&nbsp;
<a href="https://sentry.io"><img src="public/sentry.svg" alt="Sentry" height="30" /></a>
