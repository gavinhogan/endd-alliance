#!/bin/bash

# Read current version using relative path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: VERSION file not found at $VERSION_FILE"
    exit 1
fi

OLD_VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')

# Split version into parts
IFS='.' read -r major minor patch <<< "$OLD_VERSION"

# Increment patch version
patch=$((patch + 1))

# Write new version
NEW_VERSION="$major.$minor.$patch"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "Version incremented from $OLD_VERSION to $NEW_VERSION. Eleventy will sync this to the footer on the next build."
