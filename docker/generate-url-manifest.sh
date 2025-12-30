#!/bin/sh
set -e

# Generate URL Replacement Manifest
# This script runs at BUILD TIME to create a list of files that contain placeholder URLs
# This eliminates the need to scan all files at container startup

APP_NAME=$1
APP_DIR=$2

if [ -z "$APP_NAME" ] || [ -z "$APP_DIR" ]; then
  echo "Usage: $0 <app_name> <app_dir>"
  echo "Example: $0 web /app/apps/web"
  exit 1
fi

echo "🔍 Generating URL manifest for $APP_NAME..."

# Define placeholder URLs that will be replaced at runtime
PLACEHOLDER_API="https://next-api.useplunk.com"
PLACEHOLDER_DASHBOARD="https://next-app.useplunk.com"
PLACEHOLDER_LANDING="https://next.useplunk.com"
PLACEHOLDER_WIKI="https://next-wiki.useplunk.com"

# Output manifest file
MANIFEST_FILE="$APP_DIR/.next/url-manifest.txt"

# Find all files that contain placeholder URLs and save to manifest
# Search in .next directory for relevant file types
find "$APP_DIR/.next" -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.rsc" \) \
  -exec grep -l -E "$PLACEHOLDER_API|$PLACEHOLDER_DASHBOARD|$PLACEHOLDER_LANDING|$PLACEHOLDER_WIKI" {} \; \
  2>/dev/null > "$MANIFEST_FILE" || true

# Count files
FILE_COUNT=$(wc -l < "$MANIFEST_FILE" | tr -d ' ')

echo "✅ Generated manifest for $APP_NAME: $FILE_COUNT files need URL replacement"
echo "   Manifest saved to: $MANIFEST_FILE"

# Also generate manifest for sitemap/robots files
SITEMAP_MANIFEST_FILE="$APP_DIR/.next/sitemap-manifest.txt"
find "$APP_DIR/public" -type f \( -name "sitemap*.xml" -o -name "robots.txt" \) 2>/dev/null > "$SITEMAP_MANIFEST_FILE" || true
SITEMAP_COUNT=$(wc -l < "$SITEMAP_MANIFEST_FILE" | tr -d ' ')
echo "✅ Generated sitemap manifest for $APP_NAME: $SITEMAP_COUNT files"

exit 0
