---
title: Présentation de l’API Rallly
date: '2026-09-15'
category: Product
excerpt: >-
  Créez des sondages, consultez leurs résultats et fermez-les depuis vos propres
  outils. L’API est désormais disponible pour les Espaces Pro sur Rallly Cloud.
---

Rallly propose une petite API derrière une fonctionnalité masquée depuis quelque temps. Quelques personnes l’utilisent pour créer des sondages depuis leurs propres systèmes, et leurs retours ont contribué à façonner la version disponible aujourd’hui. Elle est désormais ouverte à tous les Espaces Pro sur Rallly Cloud.

![Un éditeur de code affichant une requête fetch qui crée un sondage de dates avec trois options via l’API Rallly](/static/images/rallly-api/create-poll-editor.svg)

## Ce qu’elle permet de faire

L’API couvre tout le cycle de vie d’un sondage :

- **Créer un sondage** avec des journées entières ou des créneaux horaires. Les créneaux horaires peuvent être indiqués un par un ou générés à partir d’un planning, par exemple toutes les 30 minutes entre 9 h et 17 h en semaine pendant les deux prochaines semaines.
- **Lister et consulter les sondages**, en les filtrant par statut, avec les mêmes options et paramètres que dans l’application.
- **Consulter les résultats** : le nombre de votes pour chaque option et les options en tête.
- **Consulter les participants** et voir comment chacun a voté.
- **Fermer ou supprimer** un sondage une fois la décision prise.

Chaque requête est associée à un seul Espace. La clé API identifie l’Espace : tout ce que vous créez ou consultez lui appartient.

## Pour commencer

Le propriétaire de l’Espace crée une clé dans **Paramètres → Clés API**. Les requêtes l’envoient sous forme de jeton bearer :

```sh
curl https://api.rallly.co/v1/polls \
  -H "Authorization: Bearer $RALLLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team offsite",
    "kind": "date",
    "options": [
      { "date": "2026-10-05" },
      { "date": "2026-10-06" },
      { "date": "2026-10-07" }
    ]
  }'
```

La réponse contient une `inviteUrl` à partager avec les participants et une `adminUrl` destinée à l’Organisateur. Chaque Espace peut effectuer 60 requêtes par minute.

La [documentation de référence de l’API](https://support.rallly.co/api-reference/introduction) répertorie chaque endpoint avec des exemples de requêtes et de réponses. Le document OpenAPI est également disponible si vous préférez générer un client.

## La suite

Interroger régulièrement les résultats fonctionne, mais ce n’est pas la manière dont la plupart des intégrations souhaitent fonctionner. Des webhooks pour les événements liés aux sondages sont prévus afin que votre système soit informé dès qu’une nouvelle réponse est reçue ou qu’un sondage est fermé. Aucune date n’a encore été fixée. Si vous développez quelque chose avec l’API, j’aimerais savoir ce que vous construisez et ce qui vous bloque, à l’adresse [feedback@rallly.co](mailto:feedback@rallly.co).
