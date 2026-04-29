---
title: Introducing the Rallly CLI
date: "2026-04-29"
excerpt: A new CLI for installing, configuring, and managing self-hosted Rallly instances, with HTTPS and image uploads working out of the box.
---

Self-hosting Rallly used to involve copying an example `docker-compose.yml`, editing it by hand, choosing your own reverse proxy, and wiring up an S3 bucket if you wanted image uploads to work. It was workable, but every install was a little different, and "did I configure that bit correctly?" was a recurring question in support emails.

So we built a proper CLI that handles installation, configuration, and day to day operations for you.

## One command to install

```sh
curl -fsSL https://get.rallly.co | bash
```

The installer checks your environment, walks you through configuration (domain, support email, SMTP), generates secrets for you, and brings everything up. There's nothing to edit by hand.

A working instance now bundles:

- **Rallly** itself
- **PostgreSQL** for the database
- **Traefik** as a reverse proxy with automatic Let's Encrypt certificates
- **Garage** for S3 compatible object storage, so avatar and image uploads work immediately

You no longer have to bring your own proxy or object store to get a complete instance. If you'd rather use external services (managed Postgres, AWS S3, your own Nginx or Caddy), you can: set the relevant variables in `.env` and the bundled containers for those services simply don't start.

## Manage with the CLI

Once installed, everything goes through the `rallly.sh` CLI:

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Updates in particular are now a one liner. `./rallly.sh update` pulls the latest images, recreates containers, and preserves your data and configuration. By default the CLI tracks the `lukevella/rallly:4` tag, so you'll automatically get compatible 4.x releases.

Also, by having more control over the stack, we will be able to do things like add more services in the future without complicating the install process or requiring users to edit their compose files.

## Already self-hosting?

If you're already running Rallly from a hand edited `docker-compose.yml` or `config.env`, there's a step by step [migration guide](https://support.rallly.co/self-hosting/migration) that walks you through upgrading to 4.10 and moving onto the CLI without losing data. The most important thing to carry over is your `SECRET_PASSWORD`, which encrypts sessions.

## Where to start

- **New install**: [Installation guide](https://support.rallly.co/self-hosting/installation/docker)
- **Day to day operations**: [Management guide](https://support.rallly.co/self-hosting/management)
- **Coming from an older setup**: [Migration guide](https://support.rallly.co/self-hosting/migration)

The goal with this release was to make self-hosting feel like a product rather than a recipe. If you run into anything along the way, or have ideas for what should come next, I'd love to hear from you at [feedback@rallly.co](mailto:feedback@rallly.co).
