#!/bin/sh
# Premier démarrage : génère ce dont la stack a besoin (secrets, clé OIDC, CA et certificat locaux)
# dans le volume « secrets », et les comptes de démo dans config/authelia/users_database.yml.
# Rien n'est écrit dans une image, et rien de secret n'est versionné.
# Une variable du .env, si elle existe, est reprise telle quelle : c'est ce qui permet de garder
# les secrets d'un déploiement existant au lieu d'en générer de nouveaux. Un users_database.yml
# existant n'est jamais touché.
set -eu

S=/secrets
H=/hostconfig
DOMAIN="${DOMAIN:-m2.localhost}"

# 64 caractères hexadécimaux, sans caractère à échapper dans une URL ou un fichier d'environnement
rand() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
pick() { eval "v=\${$1:-}"; if [ -n "$v" ]; then printf %s "$v"; else rand; fi; }
put() { printf %s "$2" > "$1"; chmod 644 "$1"; }
digest() { authelia crypto hash generate "$1" --password "$2" | sed -n 's/^Digest: //p'; }

# Comptes : un fichier sur l'hôte (hors du volume) pour que scripts/add-user.sh puisse y ajouter
# des utilisateurs. Créé seulement s'il n'existe pas, par exemple sur la VM il reste tel quel.
users=$H/users_database.yml
if [ ! -f "$users" ]; then
  admin_password=$(pick ADMIN_PASSWORD | head -c 24)
  alice_password=$(rand | head -c 24)
  cat > "$users" <<EOF
users:
  admin:
    disabled: false
    displayname: Admin
    password: '$(digest argon2 "$admin_password")'
    email: admin@${DOMAIN}
    groups: [admins]
  alice:
    disabled: false
    displayname: Alice
    password: '$(digest argon2 "$alice_password")'
    email: alice@${DOMAIN}
    groups: [users]
EOF
  chown "${HOST_UID:-1000}:${HOST_GID:-1000}" "$users"
  chmod 644 "$users"
  echo "================================================================"
  echo " Comptes de démo Authelia (affichés une seule fois) :"
  echo "   admin (groupe admins) : ${admin_password}"
  echo "   alice (groupe users)  : ${alice_password}"
  echo "================================================================"
fi

if [ -f "$S/.initialized" ]; then
  echo "init : secrets déjà générés (docker compose down -v pour repartir de zéro)"
  exit 0
fi

# Un sous-dossier par service : chacun ne monte que ses propres fichiers
for d in authelia authelia-db rallly-db rallly garage traefik ca-public ca-private; do
  mkdir -p "$S/$d"
  chmod 755 "$S/$d"
done
chmod 700 "$S/ca-private"

# Rallly refuse un SECRET_PASSWORD de moins de 32 caractères : le dire ici plutôt que par un 404 plus tard
if [ -n "${RALLLY_SECRET_PASSWORD:-}" ] && [ "${#RALLLY_SECRET_PASSWORD}" -lt 32 ]; then
  echo "init : RALLLY_SECRET_PASSWORD doit faire au moins 32 caractères" >&2
  exit 1
fi

# Bases créées par une version précédente de la stack, avec les mots de passe d'alors : Postgres
# n'applique POSTGRES_PASSWORD qu'à la création du volume, donc on les garde plutôt que de rendre ces bases
# inaccessibles. À changer avec ALTER USER, puis à poser dans le .env.
if [ -z "${AUTHELIA_DB_PASSWORD:-}" ] && [ -f /pg/authelia/PG_VERSION ]; then
  AUTHELIA_DB_PASSWORD=authelia
  echo "init : base authelia existante, mot de passe d'origine conservé" >&2
fi
if [ -z "${RALLLY_DB_PASSWORD:-}" ] && [ -f /pg/rallly/PG_VERSION ]; then
  RALLLY_DB_PASSWORD=rallly
  echo "init : base rallly existante, mot de passe d'origine conservé" >&2
fi
db_authelia=$(pick AUTHELIA_DB_PASSWORD)
db_rallly=$(pick RALLLY_DB_PASSWORD)
oidc_secret=$(pick RALLLY_OIDC_CLIENT_SECRET)

put "$S/authelia-db/password" "$db_authelia"
put "$S/rallly-db/password" "$db_rallly"
put "$S/garage/rpc_secret" "$(pick GARAGE_RPC_SECRET)"
# Garage refuse de démarrer si ce fichier est lisible par d'autres que son propriétaire
chmod 600 "$S/garage/rpc_secret"

put "$S/authelia/session_secret" "$(pick AUTHELIA_SESSION_SECRET)"
put "$S/authelia/storage_encryption_key" "$(pick AUTHELIA_STORAGE_ENCRYPTION_KEY)"
put "$S/authelia/jwt_secret" "$(pick AUTHELIA_JWT_SECRET)"
put "$S/authelia/oidc_hmac_secret" "$(pick AUTHELIA_OIDC_HMAC_SECRET)"
put "$S/authelia/db_password" "$db_authelia"
# Authelia ne connaît que l'empreinte du secret client ; Rallly reçoit le secret en clair
put "$S/authelia/oidc_client_digest" "$(digest pbkdf2 "$oidc_secret")"
authelia crypto pair rsa generate --bits 2048 --directory "$S/authelia" \
  --file.private-key oidc_key.pem --file.public-key oidc_key.pub > /dev/null
chmod 644 "$S/authelia/oidc_key.pem" "$S/authelia/oidc_key.pub"

# Rallly ne lit pas de fichiers de secrets : son démarrage source ce fichier
cat > "$S/rallly/env" <<EOF
export SECRET_PASSWORD='$(pick RALLLY_SECRET_PASSWORD)'
export OIDC_CLIENT_SECRET='${oidc_secret}'
export DATABASE_URL='postgres://rallly:${db_rallly}@rallly-db:5432/rallly'
EOF
chmod 644 "$S/rallly/env"

# CA de lab et certificat joker : Authelia exige du HTTPS, et Rallly doit faire confiance à la CA
# pour lire la découverte OIDC par l'adresse publique
W=$(mktemp -d)
authelia crypto certificate rsa generate --ca --common-name "Rallly lab CA" --duration 10y \
  --directory "$W" --file.certificate ca.public.crt --file.private-key ca.private.pem > /dev/null
# --path.ca est indispensable : sans lui le certificat est auto-signé, sans erreur
authelia crypto certificate rsa generate --common-name "*.${DOMAIN}" \
  --sans "*.${DOMAIN}" --sans "${DOMAIN}" --duration 1y --directory "$W" \
  --path.ca "$W" --file.ca-certificate ca.public.crt --file.ca-private-key ca.private.pem \
  --file.certificate public.crt --file.private-key private.pem > /dev/null
cp "$W/ca.public.crt" "$S/ca-public/ca.pem"
cp "$W/public.crt" "$S/traefik/cert.pem"
cp "$W/private.pem" "$S/traefik/key.pem"
cp "$W/ca.private.pem" "$S/ca-private/ca.key"
chmod 644 "$S/ca-public/ca.pem" "$S/traefik/cert.pem" "$S/traefik/key.pem"
chmod 600 "$S/ca-private/ca.key"
cat > "$S/traefik/tls.yml" <<EOF
tls:
  stores:
    default:
      defaultCertificate:
        certFile: /tls/cert.pem
        keyFile: /tls/key.pem
EOF
chmod 644 "$S/traefik/tls.yml"
rm -r "$W"

touch "$S/.initialized"

echo "init : secrets générés pour https://rallly.${DOMAIN}"
echo "       CA locale à importer dans le navigateur : docker compose cp init:/secrets/ca-public/ca.pem ."
