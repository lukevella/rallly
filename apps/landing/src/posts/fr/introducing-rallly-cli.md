---
title: Présentation de la CLI de Rallly
date: '2026-04-29'
category: Self-hosting
excerpt: >-
  Une nouvelle CLI pour installer, configurer et gérer les instances Rallly
  auto-hébergées, avec HTTPS et l’envoi d’images fonctionnels dès le départ.
---

L’auto-hébergement de Rallly nécessitait auparavant de copier un fichier `docker-compose.yml` d’exemple, de le modifier manuellement, de choisir son propre proxy inverse et de configurer un bucket S3 pour que l’envoi d’images fonctionne. C’était faisable, mais chaque installation était un peu différente, et la question « ai-je bien configuré ce paramètre ? » revenait régulièrement dans les e-mails envoyés au support.

Nous avons donc créé une véritable CLI qui s’occupe pour vous de l’installation, de la configuration et des opérations quotidiennes.

## Une commande pour installer

```sh
curl -fsSL https://get.rallly.co | bash
```

L’installateur vérifie votre environnement, vous guide dans la configuration (domaine, e-mail du support, SMTP), génère vos secrets et démarre l’ensemble des services. Vous n’avez rien à modifier manuellement.

Une instance fonctionnelle inclut désormais :

- **Rallly** lui-même
- **PostgreSQL** pour la base de données
- **Traefik** comme proxy inverse, avec des certificats Let’s Encrypt générés automatiquement
- **Garage** pour le stockage d’objets compatible S3, afin que l’envoi d’avatars et d’images fonctionne immédiatement

Vous n’avez plus besoin de fournir votre propre proxy ou stockage d’objets pour obtenir une instance complète. Si vous préférez utiliser des services externes (Postgres géré, AWS S3, votre propre Nginx ou Caddy), c’est possible : définissez les variables correspondantes dans `.env` et les conteneurs inclus pour ces services ne démarreront tout simplement pas.

## Gérer votre instance avec la CLI

Une fois l’installation terminée, tout passe par la CLI `rallly.sh` :

```sh
./rallly.sh start          # Start all services
./rallly.sh stop           # Stop all services
./rallly.sh restart        # Apply .env changes
./rallly.sh status         # Show service status
./rallly.sh logs           # Stream logs
./rallly.sh update         # Pull latest images and recreate containers
./rallly.sh backup         # Back up the database to ./backups/
```

Les mises à jour sont désormais particulièrement simples : une seule commande suffit. `./rallly.sh update` récupère les dernières images, recrée les conteneurs et conserve vos données et votre configuration. Par défaut, la CLI utilise le tag `lukevella/rallly:4`, ce qui vous permet de recevoir automatiquement les versions compatibles de la série 4.x.

De plus, le fait de mieux contrôler l’ensemble des services nous permettra d’en ajouter d’autres à l’avenir sans compliquer le processus d’installation ni demander aux utilisateurs de modifier leurs fichiers compose.

## Vous utilisez déjà l’auto-hébergement ?

Si vous utilisez déjà Rallly à partir d’un fichier `docker-compose.yml` ou `config.env` modifié manuellement, un [guide de migration](https://support.rallly.co/self-hosting/migration) détaillé vous explique comment passer à la version 4.10 et utiliser la CLI sans perdre de données. L’élément le plus important à conserver est votre `SECRET_PASSWORD`, qui chiffre les sessions.

## Par où commencer ?

- **Nouvelle installation** : [Guide d’installation](https://support.rallly.co/self-hosting/installation/docker)
- **Opérations quotidiennes** : [Guide de gestion](https://support.rallly.co/self-hosting/management)
- **Vous utilisez une ancienne configuration** : [Guide de migration](https://support.rallly.co/self-hosting/migration)

L’objectif de cette version était de faire de l’auto-hébergement un véritable produit plutôt qu’une simple recette. Si vous rencontrez un problème en cours de route ou si vous avez des idées pour la suite, n’hésitez pas à nous écrire à [feedback@rallly.co](mailto:feedback@rallly.co).
