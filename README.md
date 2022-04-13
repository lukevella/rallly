<img src="./public/logo.png" width="200"  />

[![Actions Status](https://github.com/lukevella/rallly/workflows/CI/badge.svg)](https://github.com/lukevella/rallly/actions)

Rallly is an open-source collaborative scheduling service – designed and developed by @lukevella

## Self-hosting

Although this is already technically possible by following the instructions below, I'm still working on ways to make this easier and will include better documentation to support this in the near future. Thank you for your patience.

## Running with docker

_This assumes that you have Docker installed_

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

## Running without docker

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

## Contributors

If you would like to contribute to the development of the project please reach out first before spending significant time on it.

## License

Rallly is open-source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version. See [LICENSE](LICENSE) for more detail.

## Credits

This project would not exist without the help of other great open-source projects. Thanks to the developers and teams at:

- [Next.js](https://github.com/vercel/next.js)
- [Prisma](https://github.com/prisma/prisma)
- [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)
