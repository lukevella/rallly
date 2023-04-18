# Rallly Self-Hosting Example

This repository contains all the necessary information and files to self-host your own instance of Rallly. Rallly is an open-source scheduling and collaboration tool designed to make organizing events and meetings easier.

## Table of Contents

- [Requirements](#requirements)
- [Setup Instructions](#setup-instructions)
- [Using a Reverse Proxy](#using-a-reverse-proxy)
- [Configuration Options](#configuration-options)
- [Update Instructions](#update-instructions)
- [Links](#links)

## Requirements

To run this project you will need:

- Docker
- Access to an SMTP server
- x86-64 Architecture ([arm64 support has been suspended](https://github.com/lukevella/rallly/discussions/568))

## Setup Instructions

### 1. Clone the repository

```
git clone https://github.com/lukevella/rallly-selfhosted.git
cd rallly-selfhosted
```

### 2. Add required config

In the root of this project you will find a file called `config.env`. This is where you can set your environment variables to configure your instance.

Start by generating a secret key. **Must be at least 32-characters long**.

```sh
openssl rand -base64 32
```

Open `config.env` and set `SECRET_PASSWORD` to your secret key.

Next, set `NEXT_PUBLIC_BASE_URL`. It should be the base url where this instance is accessible, including the scheme (eg. `http://` or `https://`), the domain name, and optionally a port. **Do not use trailing slashes or URLs with paths/subfolders.**.

### 3. Configure your SMTP Server

First, set `SUPPORT_EMAIL`. Your users will see this as the contact email for any support issues and it will also appear as the sender of all emails.

Next, use the following environment variables to configure your SMTP server:

- `SMTP_HOST` - The host address of your SMTP server
- `SMTP_PORT` - The port of your SMTP server
- `SMTP_SECURE` - Set to "true" if SSL is enabled for your SMTP connection
- `SMTP_USER` - The username (if auth is enabled)
- `SMTP_PWD` - The password (if auth is enabled)

### 4. Secure your instance (optional)

The default behaviour of the app is the same as on the cloud-hosted version on [rallly.co](https://rallly.co). i.e. Anyone can create polls without needing to log in. You can prevent this by setting `AUTH_REQUIRED` to `true` in `config.env` which limits poll creation and admin access to logged in users.

Additionally, you can restrict who is able to register and log in by setting `ALLOWED_EMAILS`. You can use wildcards to allow a range of email addresses.

```sh
# Example: only users matching the following patterns can register/login
ALLOWED_EMAILS="user@email.com,*@example.com,*@*.example.com"
```

### 5. Disabling the landing page (optional)

By default the app will take you to the landing page which may not be what you want. If you want to go straight in to the app, set `DISABLE_LANDING_PAGE` to `true`.

### 6. Start the server

You can start the server by running:

```
docker compose up -d
```

This command will:

- Create a postgres database
- Run migrations to set up the database schema
- Start the Next.js server on port 3000

## Using a Reverse Proxy

By default the app will run unencrypted on port 3000. If you want to serve the app over HTTPS you will need to use a [reverse proxy](/reverse-proxy/README.md).

> After setting up a reverse proxy be sure to change this line `- 3000:3000` to - `127.0.0.1:3000:3000` in `docker-compose.yml` and restart the container for it to apply changes. This prevents Rallly from being accessed remotely using HTTP on port 3000 which is a security concern.

## Configuration Options

The app can be configured with the following environment variables.

| Environment Variable   | Default               | Description                                                                                                                                     |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_REQUIRED`        | false                 | Set to `true` to require authentication for creating new polls and accessing admin pages                                                        |
| `ALLOWED_EMAILS`       |                       | Comma separated list of email addresses that are allowed to register and login. Wildcard characters are supported. Example: `*@yourcompany.com` |
| `DATABASE_URL`         |                       | Postgres database connection string                                                                                                             |
| `DISABLE_LANDING_PAGE` | false                 | Whether or not to disable the landing page                                                                                                      |
| `NEXT_PUBLIC_BASE_URL` | http://localhost:3000 | The base url where this instance is accessible, including the scheme (eg. `http://` or `https://`), the domain name, and optionally a port.     |
| `SECRET_PASSWORD`      |                       | A random 32-character secret key used to encrypt user sessions                                                                                  |
| `SUPPORT_EMAIL`        |                       | All outgoing emails will show this email as the sender's email address, which also serves as the support email.                                 |
| `SMTP_HOST`            | localhost             | The host address of your SMTP server                                                                                                            |
| `SMTP_PORT`            | 25 or 465             | The port of your SMTP server                                                                                                                    |
| `SMTP_SECURE`          | false                 | Set to "true" if SSL is enabled for your SMTP connection                                                                                        |
| `SMTP_USER`            |                       | The username (if auth is enabled on your SMTP server)                                                                                           |
| `SMTP_PWD`             |                       | The password (if auth is enabled on your SMTP server)                                                                                           |

## Update Instructions

Rallly is constantly being updated but you will need to manually pull these updates and restart the server to run the latest version. You can do this by running the following commands from within this directory:

```sh
docker compose down
docker compose pull
docker compose up -d
```

### Version management

You can pin a specific version of Rallly by changing the `image` line in `docker-compose.yml`:

```
- image: lukevella/rallly:<version>
```

Check the [releases](https://github.com/lukevella/rallly/releases) to see what versions are available.
We follow semver versioning so you may want to set your version to a major release (e.g. `lukevella/rallly:2`) to avoid pulling in breaking changes.

## Links

- [Source code](https://github.com/lukevella/rallly)
