#!/bin/bash

# Read current version
VERSION_FILE="/Users/gavinhogan/Documents/confuzed/VERSION"
OLD_VERSION=$(cat "$VERSION_FILE")

# Split version into parts
IFS='.' read -r major minor patch <<< "$OLD_VERSION"

# Increment patch version
patch=$((patch + 1))

# Write new version
NEW_VERSION="$major.$minor.$patch"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "Version incremented from $OLD_VERSION to $NEW_VERSION. Eleventy will sync this to the footer on the next build."
