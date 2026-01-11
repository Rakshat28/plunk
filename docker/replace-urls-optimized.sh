#!/bin/sh
set -e

# Optimized URL Replacement Script
# Uses pre-generated manifests to avoid expensive find+grep operations at runtime

replace_urls_in_app() {
  local app=$1
  local app_dir=$2

  echo "📝 Replacing URLs in $app build files..."

  # Define placeholder URLs (built into the app at compile time)
  local PLACEHOLDER_API="https://next-api.useplunk.com"
  local PLACEHOLDER_DASHBOARD="https://next-app.useplunk.com"
  local PLACEHOLDER_LANDING="https://next.useplunk.com"
  local PLACEHOLDER_WIKI="https://next-wiki.useplunk.com"

  # Use pre-generated manifest instead of scanning all files
  local manifest_file="$app_dir/.next/url-manifest.txt"

  if [ ! -f "$manifest_file" ]; then
    echo "   ⚠️  Warning: Manifest file not found at $manifest_file"
    echo "   This suggests the build process didn't complete correctly."
    echo "   Falling back to runtime file scanning (slower)..."

    # Fallback to old method if manifest doesn't exist
    local temp_file_list="/tmp/replace_urls_${app}.txt"
    find "$app_dir/.next" -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.rsc" \) \
      -exec grep -l -E "$PLACEHOLDER_API|$PLACEHOLDER_DASHBOARD|$PLACEHOLDER_LANDING|$PLACEHOLDER_WIKI" {} \; \
      2>/dev/null > "$temp_file_list" || true
    manifest_file="$temp_file_list"
  fi

  # Count files from manifest
  local file_count=$(wc -l < "$manifest_file" | tr -d ' ')
  echo "   📊 Processing $file_count files from manifest"

  if [ "$file_count" -gt 0 ]; then
    # Process files using xargs for better performance
    # Use -P 4 to process up to 4 files in parallel
    # This significantly speeds up processing of many files
    #
    # IMPORTANT: The manifest contains build-time paths (e.g., /app/apps/web/.next/...)
    # but we need to translate them to runtime standalone paths
    # (e.g., /app/apps/web/.next/standalone/apps/web/.next/...)
    cat "$manifest_file" | while IFS= read -r build_path; do
      # Translate build path to runtime standalone path
      # Build path format: /app/apps/<app>/.next/...
      # Runtime path format: /app/apps/<app>/.next/standalone/apps/<app>/.next/...

      # Extract the relative path after /app/apps/<app>/
      rel_path="${build_path#/app/apps/${app}/}"

      # Construct runtime path in standalone directory
      runtime_path="$app_dir/$rel_path"

      if [ -f "$runtime_path" ]; then
        sed -e "s|$PLACEHOLDER_API|$API_URI|g" \
            -e "s|$PLACEHOLDER_DASHBOARD|$DASHBOARD_URI|g" \
            -e "s|$PLACEHOLDER_LANDING|$LANDING_URI|g" \
            -e "s|$PLACEHOLDER_WIKI|$WIKI_URI|g" \
            "$runtime_path" > "${runtime_path}.tmp" && mv "${runtime_path}.tmp" "$runtime_path"
      else
        echo "   ⚠️  Warning: File not found at runtime: $runtime_path"
      fi
    done

    echo "   ✅ Successfully replaced URLs in $file_count files"
  else
    echo "   ℹ️  No files found with placeholder URLs"
  fi

  # Process sitemap and robots.txt from manifest
  echo "   🗺️  Processing sitemap and robots.txt..."
  local sitemap_manifest="$app_dir/.next/sitemap-manifest.txt"

  if [ -f "$sitemap_manifest" ]; then
    while IFS= read -r build_sitemap_path; do
      # Translate build path to runtime path
      # Build path format: /app/apps/<app>/public/...
      # Runtime path format: /app/apps/<app>/.next/standalone/apps/<app>/public/...

      # Extract the relative path after /app/apps/<app>/
      rel_path="${build_sitemap_path#/app/apps/${app}/}"

      # Construct runtime path in standalone directory
      runtime_sitemap_path="$app_dir/$rel_path"

      if [ -f "$runtime_sitemap_path" ]; then
        sed -e "s|$PLACEHOLDER_API|$API_URI|g" \
            -e "s|$PLACEHOLDER_DASHBOARD|$DASHBOARD_URI|g" \
            -e "s|$PLACEHOLDER_LANDING|$LANDING_URI|g" \
            -e "s|$PLACEHOLDER_WIKI|$WIKI_URI|g" \
            "$runtime_sitemap_path" > "${runtime_sitemap_path}.tmp" && mv "${runtime_sitemap_path}.tmp" "$runtime_sitemap_path"
      else
        echo "   ⚠️  Warning: Sitemap file not found at runtime: $runtime_sitemap_path"
      fi
    done < "$sitemap_manifest"
  else
    # Fallback to finding sitemaps at runtime
    find "$app_dir/public" -type f \( -name "sitemap*.xml" -o -name "robots.txt" \) 2>/dev/null | while IFS= read -r sitemap_file; do
      if [ -f "$sitemap_file" ]; then
        sed -e "s|$PLACEHOLDER_API|$API_URI|g" \
            -e "s|$PLACEHOLDER_DASHBOARD|$DASHBOARD_URI|g" \
            -e "s|$PLACEHOLDER_LANDING|$LANDING_URI|g" \
            -e "s|$PLACEHOLDER_WIKI|$WIKI_URI|g" \
            "$sitemap_file" > "${sitemap_file}.tmp" && mv "${sitemap_file}.tmp" "$sitemap_file"
      fi
    done
  fi

  # Special handling for wiki: also replace URLs in openapi.local.json
  if [ "$app" = "wiki" ]; then
    local openapi_file="$app_dir/openapi.local.json"
    if [ -f "$openapi_file" ]; then
      echo "   🔄 Replacing URLs in openapi.local.json"
      sed -e "s|$PLACEHOLDER_API|$API_URI|g" \
          -e "s|$PLACEHOLDER_DASHBOARD|$DASHBOARD_URI|g" \
          -e "s|$PLACEHOLDER_LANDING|$LANDING_URI|g" \
          -e "s|$PLACEHOLDER_WIKI|$WIKI_URI|g" \
          "$openapi_file" > "${openapi_file}.tmp" && mv "${openapi_file}.tmp" "$openapi_file"
      echo "   ✅ Updated OpenAPI spec with runtime URLs"
    fi
  fi

  # Generate .env file for server-side Next.js standalone
  cat > "$app_dir/.env" << EOF
# Runtime environment configuration
# Generated at container startup from environment variables
API_URI=${API_URI}
DASHBOARD_URI=${DASHBOARD_URI}
LANDING_URI=${LANDING_URI}
WIKI_URI=${WIKI_URI}
EOF

  echo "✅ URL replacement complete for $app"
}

# Export the function so it can be sourced by other scripts
if [ "$1" != "" ]; then
  # If called directly with arguments, execute the function
  replace_urls_in_app "$1" "$2"
fi
