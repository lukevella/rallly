<img src="./public/logo.png" width="200"  />

[![Actions Status](https://github.com/lukevella/rallly/workflows/ci/badge.svg)](https://github.com/lukevella/rallly/actions)

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

You will need to supply a url to an empty postgres database.

```
# /.env
DATABASE_URL='postgresql://user:password@hostname/dbname'
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
