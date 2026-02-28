#!/bin/bash

# Read current version
VERSION_FILE="/Users/gavinhogan/Documents/confuzed/VERSION"
VERSION=$(cat "$VERSION_FILE")

# Split version into parts
IFS='.' read -r major minor patch <<< "$VERSION"

# Increment patch version
patch=$((patch + 1))

# Write new version
NEW_VERSION="$major.$minor.$patch"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "Version incremented to $NEW_VERSION"
