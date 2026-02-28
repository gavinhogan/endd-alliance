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

# Sync with HTML files
# Assuming version is stored as "VERSION: x.x.x" in footers
grep -rli "VERSION: " . --include="*.html" | xargs -I@ sed -i '' "s/VERSION: $OLD_VERSION/VERSION: $NEW_VERSION/g" @

echo "Version incremented from $OLD_VERSION to $NEW_VERSION and synced to HTML."
