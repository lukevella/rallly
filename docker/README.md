# Rallly derrière Traefik et Authelia (projet Dev avec Docker)

Ce dépôt est notre fork de Rallly. Pour le module Dev avec Docker on a monté autour une stack Docker
Compose : un reverse proxy (Traefik), un SSO OIDC et Rallly derrière. Le sujet parle d'Authentik, on a
pris Authelia à la place (le prof a validé ce choix).

Tout ce qui concerne la stack est dans `docker/preprod/`. Ce fichier explique comment la lancer, ce qu'il
y a dedans et ce qu'on a fait pour la sécurité. Le reste du dépôt, c'est Rallly.

La branche qu'on utilise est `preprod` (c'est celle que la CI déploie). `main` ne bouge pas, c'est juste
un miroir du dépôt d'origine de Rallly.

## Ce qu'il y a dans la stack

```
                      navigateur
                          |
                    80 / 443 (hôte)
                          |
                      [ traefik ] ---- socket-proxy ---- /var/run/docker.sock (lecture seule)
                          |
        +-----------------+------------------+
        |                 |                  |
  auth.<domaine>    rallly.<domaine>    mail.<domaine>
   [ authelia ]       [ rallly ]         [ mailpit ]   <- derrière le forward-auth Authelia
        |                 |
  [ authelia-db ]    [ rallly-db ]       [ garage ] (stockage S3, pas encore utilisé par Rallly)
```

Les services :

- `traefik` : seul point d'entrée, il gère le HTTPS et route d'après le nom d'hôte. Il ne monte pas le
  socket Docker lui-même, il passe par `socket-proxy` qui n'autorise que la lecture (conteneurs, réseaux).
- `authelia` : le fournisseur d'identité. Il fait le SSO OIDC pour Rallly et protège Mailpit.
- `rallly` : l'application (notre image, construite par la CI à partir de ce dépôt).
- `authelia-db` et `rallly-db` : deux Postgres 16 séparés.
- `mailpit` : un faux serveur SMTP avec une interface web. Authelia et Rallly y envoient leurs mails, rien
  ne part vraiment sur Internet.
- `garage` : stockage S3. Il est démarré mais Rallly ne s'en sert pas pour l'instant.
- `cloudflared` : seulement avec le profil `tunnel` (voir la partie VM).

Les réseaux :

- `proxy` : Traefik, Authelia, Rallly et Mailpit.
- `backend` : les bases de données, Garage, et les services qui en ont besoin. Il est `internal`, donc
  rien là-dedans n'est joignable de l'extérieur et les bases n'ont aucun port publié.
- `socket` : uniquement Traefik et `socket-proxy`, aussi `internal`.

Les volumes nommés : `authelia_db`, `rallly_db`, `garage_meta`, `garage_data`.

Les seuls ports ouverts sur l'hôte sont 80 et 443 (Traefik) et le tableau de bord de Traefik sur
`127.0.0.1:8080`, donc visible uniquement depuis la machine elle-même.

## Lancer en local

Il faut Docker (avec Compose v2) et `openssl`.

```
git clone <url du dépôt>
cd rallly
git switch preprod
cd docker/preprod
./scripts/local-setup.sh
docker compose up -d --wait
```

`local-setup.sh` crée tout ce qui n'est pas dans le dépôt parce que c'est secret : le `.env` avec des
secrets tirés au hasard, la clé de signature OIDC, le fichier des utilisateurs, et un certificat local.
Il s'arrête s'il y a déjà un `.env`, pour ne rien écraser (`--force` pour tout refaire). Au premier lancement les images
sont téléchargées, ça prend quelques minutes.

Une fois que c'est démarré :

- Rallly : https://rallly.m2.localhost
- Authelia : https://auth.m2.localhost
- Mailpit : https://mail.m2.localhost (réservé au groupe `admins`)
- Tableau de bord Traefik : http://127.0.0.1:8080

Comptes de démo (local uniquement) :

- `admin`, groupe `admins`, mot de passe `demo-local-pass`
- `alice`, groupe `users`, mot de passe `demo-local-pass`

Les adresses en `*.localhost` se résolvent toutes seules vers la machine (testé sur Mac uniquement).
Le certificat est signé par une petite autorité qu'on génère nous-mêmes (`certs/ca.crt`), donc
le navigateur va afficher un avertissement : soit on l'accepte, soit on importe `certs/ca.crt`. Rallly,
lui, fait confiance à cette autorité (`NODE_EXTRA_CA_CERTS`), sinon il ne pourrait pas lire la
configuration OIDC d'Authelia.

Pour tout effacer et repartir de zéro : `docker compose down -v`.

Sur un Mac avec puce Apple, l'image de Rallly tourne en émulation parce que la CI ne la publie qu'en
amd64. C'est plus lent au démarrage mais ça marche.

Si on veut tester une version de Rallly qui n'est pas encore passée par la CI, on peut construire l'image
nous-mêmes avec la même commande que la CI (cette variante n'a pas été testée en local) :

```
docker build -f apps/web/Dockerfile --build-arg SELF_HOSTED=true -t rallly:local .
```

puis mettre `RALLLY_IMAGE=rallly:local` dans le `.env` et refaire `docker compose up -d`.

## Local et VM : ce qui est pareil, ce qui change

C'est le même `docker-compose.yml` des deux côtés, avec les mêmes images et la même configuration
Authelia. En local on ajoute seulement `docker-compose.local.yml` (le script l'active avec la variable
`COMPOSE_FILE` du `.env`). Les écarts :

- Le domaine : `m2.localhost` en local, le vrai domaine de la VM dans son `.env`.
- Le HTTPS : en local Traefik sert le certificat généré par le script. Sur la VM le trafic public arrive
  par le tunnel Cloudflare (voir plus bas).
- En local, Traefik répond aussi aux noms `auth.*` et `rallly.*` depuis l'intérieur du réseau `proxy`, pour
  que le conteneur Rallly puisse joindre Authelia avec la même URL que le navigateur.
- L'image de Rallly : en local on récupère celle que la CI a publiée, sur la VM c'est celle du commit
  déployé (`ghcr.io/ogb4n/rallly:sha-xxxxxxx`).
- Les comptes : ceux de démo en local, sur la VM les vrais comptes qu'on y a créés.

## Sur la VM

Le déploiement est automatique : un push sur `preprod` lance le workflow `preprod.yml` (voir CI/CD plus
bas) et le dernier job tourne sur un runner GitHub installé sur la VM. Il copie `docker/preprod/` dans
`/home/ogb4n/stack`, se connecte à GHCR avec le jeton du job, puis lance
`docker compose --profile tunnel up -d --wait`.

Les secrets ne sont jamais dans le dépôt. Ils sont dans le dossier de la stack sur la VM : le `.env`, le
`users_database.yml` et la clé `oidc_key.pem`. La copie de la CI ne les écrase pas puisqu'ils n'existent
pas dans le dépôt. Pour créer un `.env` à la main on part de `.env.example` (les commandes pour générer
chaque secret sont dedans).

Le profil `tunnel` démarre `cloudflared`, qui relie la stack à un tunnel Cloudflare avec un jeton
(`CLOUDFLARE_TUNNEL_TOKEN` dans le `.env`). C'est ce tunnel qui rend la stack joignable depuis Internet ;
sans ce profil elle tourne quand même, mais pas pour les gens de l'extérieur. C'est un écart avec le sujet,
qui parle du VPN du campus pour accéder à la VM.

Pour revenir en arrière, on relance le workflow sur un ancien commit : l'image déployée est celle du commit,
pas `latest`.

URL de démo pour le formateur : à renseigner avant la soutenance.

## Authelia : SSO, groupes, invitation

**SSO.** Rallly est déclaré comme client OIDC dans `config/authelia/configuration.yml` (client `rallly`,
secret stocké haché, PKCE en S256, scopes `openid profile email`). Du côté de Rallly c'est configuré avec
les variables `OIDC_*` du compose. L'URL de retour à déclarer chez Authelia est
`https://rallly.<domaine>/api/auth/callback/oidc` : si elle ne correspond pas exactement à celle que Rallly
envoie, Authelia refuse la connexion.

Rallly n'est volontairement pas derrière le forward-auth d'Authelia, sinon les gens qui reçoivent un lien
de sondage ne pourraient pas l'ouvrir. La connexion se fait avec le bouton « Authelia » de la page de
login de Rallly, et l'identité du votant vient de là (voir la feature 1 plus bas).

**Groupes.** Il y a deux groupes, `admins` et `users`, définis dans `users_database.yml`. La politique
d'accès est dans `access_control` : tout est refusé par défaut, `mail.<domaine>` n'est ouvert qu'au groupe
`admins`, le reste des sous-domaines demande une authentification simple. Pour le voir en local : se
connecter à https://auth.m2.localhost avec `alice` puis ouvrir https://mail.m2.localhost, on a une erreur
403 ; avec `admin`, Mailpit s'ouvre. La limite : pour Rallly (le client OIDC) tout le monde a les mêmes
droits, les groupes ne jouent que sur l'accès à Mailpit.

**Inviter quelqu'un d'extérieur.** Il n'y a pas d'inscription libre, un compte doit être créé par un
admin :

```
./scripts/add-user.sh <identifiant> <email> [groupe]
```

Le script crée le compte avec un mot de passe aléatoire, relance Authelia pour qu'il relise le fichier, et
affiche l'identifiant et le mot de passe qu'on transmet à la personne. Elle peut ensuite voter sur Rallly
avec le bouton « Authelia ». Le fichier d'utilisateurs est monté en lecture seule dans le conteneur, donc
on ne compte pas sur la réinitialisation de mot de passe depuis l'interface (pas testée). Et comme les mails
vont dans Mailpit, aucun mail d'invitation n'arrive dans une vraie boîte : le mot de passe se transmet à la
main.

## CI/CD

Tout est dans `.github/workflows/`.

`preprod.yml` (à chaque push sur `preprod`) :

1. construit l'image de Rallly avec `apps/web/Dockerfile` (multi-stage, utilisateur non-root) ;
2. la teste : démarre l'image avec un Postgres et vérifie que `/api/status` répond et que la base est
   connectée ;
3. la scanne avec Trivy : le rapport complet (HIGH et CRITICAL) va dans l'onglet Security, et une faille
   CRITICAL corrigeable bloque le workflow ;
4. publie l'image sur GHCR, taguée `sha-<commit>` et `preprod`, seulement si tout ce qui précède est vert ;
5. déploie sur la VM et vérifie que la découverte OIDC d'Authelia répond.

`security.yml` (sur les PR vers `preprod` et à chaque push) : Trivy sur le dépôt (dépendances, secrets,
configuration Docker) et SonarQube sur les PR.

`ci.yml` est celui de Rallly (typage, lint, tests unitaires et d'intégration) et tourne sur `main` et les PR
vers `main`.

Les actions sont épinglées par SHA et le workflow de déploiement n'a pas de déclencheur `pull_request` : le
dépôt est public, une PR extérieure ne doit pas pouvoir exécuter du code sur la VM.

La preuve que ça passe : l'onglet Actions du dépôt, branche `preprod`. C'est notre branche principale pour
la CI.

## Les features

On a fait trois features du catalogue du sujet :

1. **Voter uniquement avec une session OAuth** (n°1). Avec `REQUIRE_AUTH_TO_VOTE=true`, un invité ne peut
   plus répondre à un sondage : le formulaire affiche « Log in to respond to this poll » et l'action
   serveur refuse. Quand on est connecté, le nom et l'email du vote viennent du compte (donc d'Authelia) et
   pas du formulaire. Par défaut la variable est à `false`, donc une instance Rallly normale ne change pas ;
   notre stack la met à `true`. La modification d'une réponse par le lien reçu par mail n'est pas touchée.
2. **Plafond de participants par créneau** (n°3). Dans le formulaire de création et de modification d'un
   sondage on peut fixer un nombre maximum de « oui » par option. Au-delà, la réponse est refusée avec un
   message qui dit que l'option est complète.
3. **Sondage de lieu** (n°6). On peut créer un sondage dont les options sont des lieux (nom, adresse, lien)
   au lieu de dates. Les participants votent, l'organisateur finalise le lieu gagnant et ça ferme le
   sondage. Pour l'instant l'API v1, les webhooks et les invitations par mail ne gèrent pas ces sondages.

Chacune a ses tests unitaires, et les plafonds et les sondages de lieu ont aussi un test Playwright
(`apps/web/tests/`).

## Sécurité : ce qu'on a fait et ce qu'on assume

Ce qu'on a mis en place :

- les conteneurs Traefik, Authelia, Rallly, Mailpit et cloudflared ont `cap_drop: ALL` et
  `no-new-privileges` ;
- Rallly tourne avec un utilisateur non-root dans l'image ;
- les secrets sont hors du dépôt et hors des images (`.env`, fichiers montés), avec un `.env.example` ;
- le socket Docker n'est pas monté dans Traefik mais dans un proxy en lecture seule ;
- les bases ne sont que sur un réseau `internal` ;
- les images ont des versions fixées (pas de `latest`), et celle de Rallly est épinglée sur le commit ;
- scan Trivy de l'image avant publication.

Les limites qu'on assume :

- les mots de passe des deux Postgres (`authelia` et `rallly`) sont écrits dans le compose. Les bases ne
  sont joignables que depuis le réseau interne, mais ce n'est pas propre ;
- les Postgres, Garage et `socket-proxy` n'ont pas `cap_drop: ALL` (l'entrypoint de Postgres a besoin de
  certaines capabilities, on ne l'a pas durci) ;
- Trivy ne bloque que sur CRITICAL, les HIGH sont seulement remontées dans le rapport ;
- les images de base ne sont pas épinglées par digest ;
- Traefik tourne avec `api.insecure`, le tableau de bord est donc sans authentification : il n'est publié
  que sur `127.0.0.1`, et on n'y accède que depuis la machine ;
- en local le certificat est auto-signé, et Authelia est limité à une authentification simple (pas de 2FA) ;
- Mailpit remplace un vrai SMTP, donc aucun mail réel n'est envoyé ;
- Garage tourne sans servir à rien pour l'instant, on l'a gardé pour brancher le stockage de Rallly plus
  tard.
