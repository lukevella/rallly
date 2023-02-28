#!/bin/bash

read -p "Enter the new version number: " new_version

# Check if the version number follows semver format
if ! [[ $new_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid version number. The version number must follow the semver format (e.g. 1.0.0)."
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "Error: package.json file not found."
  exit 1
fi

# Replace the version in the package.json file
sed -i "" "s/\"version\": \".*\"/\"version\": \"$new_version\"/g" package.json

# Update the changelog file
yarn changelog:update

# Run prettier on the changelog file
yarn prettier --write CHANGELOG.md

# Commit the changes with a message indicating the new version number
git add package.json CHANGELOG.md
git commit -m "🔖 Release $new_version"

# Tag the commit with the new version number (prefixed with "v")
git tag -a "v$new_version" -m "Tag for version $new_version"

echo "Version in package.json file updated to $new_version, changelog updated, and tagged in Git as v$new_version"
