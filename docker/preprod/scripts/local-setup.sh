#!/usr/bin/env bash
# Prépare tout ce qui n'est pas dans le dépôt pour lancer la stack en local :
# .env avec des secrets aléatoires, clé OIDC, comptes de démo Authelia, certificat local.
# Ne touche à rien de ce qui existe déjà, sauf avec --force.
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN=m2.localhost
AUTHELIA_TAG=4.39
DEMO_PASSWORD='demo-local-pass'

force=0
[ "${1:-}" = "--force" ] && force=1

for cmd in docker openssl; do
  command -v "$cmd" >/dev/null || { echo "il manque $cmd" >&2; exit 1; }
done
docker info >/dev/null 2>&1 || { echo "le daemon docker ne répond pas" >&2; exit 1; }

# garde-fou : on ne veut pas écraser la config d'une VM par erreur
if [ -f .env ] && [ "$force" -eq 0 ]; then
  echo ".env existe déjà, rien n'est modifié (utiliser --force pour tout regénérer)"
  exit 0
fi

hash_argon2() {
  docker run --rm "authelia/authelia:${AUTHELIA_TAG}" \
    authelia crypto hash generate argon2 --password "$1" | sed -n 's/^Digest: //p'
}

hash_pbkdf2() {
  docker run --rm "authelia/authelia:${AUTHELIA_TAG}" \
    authelia crypto hash generate pbkdf2 --variant sha512 --password "$1" | sed -n 's/^Digest: //p'
}

echo "certificat local pour *.${DOMAIN}"
mkdir -p certs
openssl genrsa -out certs/ca.key 2048 2>/dev/null
openssl req -x509 -new -key certs/ca.key -sha256 -days 825 \
  -subj "/CN=Rallly local CA" -out certs/ca.crt
openssl genrsa -out certs/local.key 2048 2>/dev/null
openssl req -new -key certs/local.key -subj "/CN=${DOMAIN}" -out certs/local.csr
printf 'subjectAltName=DNS:%s,DNS:*.%s\nbasicConstraints=CA:FALSE\n' "$DOMAIN" "$DOMAIN" > certs/local.ext
openssl x509 -req -in certs/local.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial \
  -days 825 -sha256 -extfile certs/local.ext -out certs/local.crt 2>/dev/null
rm -f certs/local.csr certs/local.ext certs/ca.srl
# Traefik tourne sans CAP_DAC_OVERRIDE (cap_drop ALL) : la clé doit être lisible par tout le monde.
# C'est une clé jetable, valable uniquement pour *.m2.localhost.
chmod 644 certs/*

echo "clé de signature OIDC"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out config/authelia/oidc_key.pem 2>/dev/null
chmod 644 config/authelia/oidc_key.pem

echo "comptes de démo Authelia"
demo_hash=$(hash_argon2 "$DEMO_PASSWORD")
cat > config/authelia/users_database.yml <<EOF
users:
  admin:
    disabled: false
    displayname: Admin
    password: '${demo_hash}'
    email: admin@${DOMAIN}
    groups: [admins]
  alice:
    disabled: false
    displayname: Alice
    password: '${demo_hash}'
    email: alice@${DOMAIN}
    groups: [users]
EOF
chmod 644 config/authelia/users_database.yml

echo "fichier .env"
oidc_secret=$(openssl rand -hex 32)
oidc_digest=$(hash_pbkdf2 "$oidc_secret")
cat > .env <<EOF
# généré par scripts/local-setup.sh, ne pas committer
COMPOSE_FILE=docker-compose.yml:docker-compose.local.yml
DOMAIN=${DOMAIN}
AUTHELIA_TAG=${AUTHELIA_TAG}
HOST_UID=$(id -u)
HOST_GID=$(id -g)

AUTHELIA_SESSION_SECRET=$(openssl rand -hex 32)
AUTHELIA_STORAGE_ENCRYPTION_KEY=$(openssl rand -hex 32)
AUTHELIA_JWT_SECRET=$(openssl rand -hex 32)
AUTHELIA_OIDC_HMAC_SECRET=$(openssl rand -hex 32)
RALLLY_SECRET_PASSWORD=$(openssl rand -hex 32)
GARAGE_RPC_SECRET=$(openssl rand -hex 32)

RALLLY_OIDC_CLIENT_SECRET=${oidc_secret}
RALLLY_OIDC_CLIENT_SECRET_DIGEST='${oidc_digest}'

# image de Rallly : celle de la CI par défaut, voir README pour la construire en local
# RALLLY_IMAGE=rallly:local
EOF

echo
echo "c'est prêt : docker compose up -d"
echo "comptes de démo : admin et alice, mot de passe ${DEMO_PASSWORD}"
