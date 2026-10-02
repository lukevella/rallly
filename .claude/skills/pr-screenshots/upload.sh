#!/usr/bin/env bash
# Uploads files to refs/meta/pr-assets on origin and prints a commit-pinned raw URL
# for each. Usage: upload.sh <pr-number> <file>...
#
# refs/meta/pr-assets is not a branch, so the push triggers neither GitHub Actions
# nor Vercel. A temporary index keeps the worktree and branch untouched.
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <pr-number> <file>..." >&2
  exit 1
fi

REF=refs/meta/pr-assets
pr="$1"
shift

# Files land at <pr>/<basename>, so two inputs with one name would collide.
duplicates=$(for file in "$@"; do basename "$file"; done | sort | uniq -d)
if [ -n "$duplicates" ]; then
  echo "duplicate file names: $duplicates" >&2
  exit 1
fi

urlencode() {
  local LC_ALL=C s="$1" out="" c i
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [A-Za-z0-9._~-]) out+="$c" ;;
      # printf reads bytes above 0x7F as negative; mask back to one byte.
      *) out+=$(printf '%%%02X' $(($(printf '%d' "'$c") & 255))) ;;
    esac
  done
  printf '%s' "$out"
}

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
git fetch -q origin "+$REF:$REF" 2>/dev/null || true

export GIT_INDEX_FILE
GIT_INDEX_FILE=$(mktemp)
trap 'rm -f "$GIT_INDEX_FILE"' EXIT

parent=()
if git rev-parse -q --verify "$REF" >/dev/null; then
  git read-tree "$REF"
  parent=(-p "$(git rev-parse "$REF")")
else
  git read-tree --empty
fi

for file in "$@"; do
  blob=$(git hash-object -w "$file")
  git update-index --add --cacheinfo "100644,$blob,$pr/$(basename "$file")"
done

tree=$(git write-tree)
# macOS ships bash 3.2, where an empty array is unbound under set -u.
commit=$(git commit-tree "$tree" ${parent[@]+"${parent[@]}"} -m "PR #$pr assets")
git update-ref "$REF" "$commit"
git push -q origin "$REF:$REF"

for file in "$@"; do
  url="https://raw.githubusercontent.com/$repo/$commit/$pr/$(urlencode "$(basename "$file")")"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" != "200" ]; then
    echo "$url returned $status" >&2
    exit 1
  fi
  echo "$url"
done
