#!/usr/bin/env bash
# Invite quelqu'un d'extérieur : crée son compte Authelia avec un mot de passe aléatoire
# et l'affiche, à lui transmettre. Authelia est relancé pour relire le fichier d'utilisateurs.
#
#   ./scripts/add-user.sh <identifiant> <email> [groupe]     (groupe par défaut : users)
#
# À lancer depuis le dossier de la stack (docker/preprod en local, le dossier de la VM sinon).
set -euo pipefail

cd "$(dirname "$0")/.."

[ $# -ge 2 ] || { echo "usage: $0 <identifiant> <email> [groupe]" >&2; exit 1; }
login=$1
email=$2
group=${3:-users}
users_file=config/authelia/users_database.yml

[ -f "$users_file" ] || { echo "$users_file introuvable" >&2; exit 1; }
grep -q "^  ${login}:" "$users_file" && { echo "l'utilisateur ${login} existe déjà" >&2; exit 1; }

tag=$(sed -n 's/^AUTHELIA_TAG=//p' .env)
password=$(openssl rand -hex 8)
hash=$(docker run --rm "authelia/authelia:${tag}" \
  authelia crypto hash generate argon2 --password "$password" | sed -n 's/^Digest: //p')

# on s'assure que le fichier finit par un retour à la ligne avant d'ajouter
[ -z "$(tail -c1 "$users_file")" ] || echo >> "$users_file"
cat >> "$users_file" <<EOF
  ${login}:
    disabled: false
    displayname: ${login}
    password: '${hash}'
    email: ${email}
    groups: [${group}]
EOF

docker compose restart authelia >/dev/null

echo "compte créé"
echo "  identifiant : ${login}"
echo "  mot de passe : ${password}"
echo "  groupe : ${group}"
