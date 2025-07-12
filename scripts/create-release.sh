#!/bin/bash

# Function to increment version based on semantic versioning
increment_version() {
  local version=$1
  local release_type=$2
  
  # Extract version components
  local major=$(echo $version | cut -d. -f1)
  local minor=$(echo $version | cut -d. -f2)
  local patch=$(echo $version | cut -d. -f3)
  
  case $release_type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "Invalid release type"
      exit 1
      ;;
  esac
  
  echo "$major.$minor.$patch"
}

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json file not found."
  exit 1
fi

# Get current version from package.json
current_version=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
echo "Current version: $current_version"

# Prompt for release type
echo "Select release type:"
echo "1) patch - for backwards compatible bug fixes"
echo "2) minor - for backwards compatible new features"
echo "3) major - for incompatible API changes"
read -p "Enter your choice (1-3): " choice

case $choice in
  1) release_type="patch" ;;
  2) release_type="minor" ;;
  3) release_type="major" ;;
  *) 
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

# Calculate new version
new_version=$(increment_version $current_version $release_type)
echo "New version will be: $new_version"

# Confirm before proceeding
read -p "Proceed with release? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Release cancelled."
  exit 0
fi

# Replace the version in the package.json file
sed -i "" "s/\"version\": \".*\"/\"version\": \"$new_version\"/g" package.json

# Commit the changes with a message indicating the new version number
git add package.json
git commit -m "🔖 Release $new_version"

# Tag the commit with the new version number (prefixed with "v")
git tag -a "v$new_version" -m "Tag for version $new_version"

echo "***v$new_version is ready for release 🚀***"
