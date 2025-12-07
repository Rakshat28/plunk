#!/bin/sh
set -e

# Nginx-enabled Docker Entrypoint for Plunk
# Starts all Plunk services with nginx reverse proxy

echo "🚀 Starting Plunk with Nginx reverse proxy..."
echo "📦 Service: ${SERVICE:-all}"

# Only run with SERVICE=all for nginx setup
if [ "$SERVICE" != "all" ]; then
    echo "⚠️  This nginx-enabled image only supports SERVICE=all"
    echo "   For individual services, use the standard Plunk image"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
cd /app
if ! yarn workspace @plunk/db migrate:prod; then
  echo ""
  echo "❌ ERROR: Database migration failed!"
  echo "   The container cannot start with failed migrations."
  echo "   Please check:"
  echo "   1. DATABASE_URL is set correctly"
  echo "   2. Database server is accessible from this container"
  echo "   3. Database credentials are valid"
  echo "   4. Migration logs above for specific errors"
  echo ""
  exit 1
fi
echo "✅ Database migrations completed successfully"

# Setup nginx configuration and source it to get env vars
. /app/docker/nginx/setup-nginx.sh

# Verify environment variables are set
echo "🔍 Domain configuration:"
echo "   API_DOMAIN=${API_DOMAIN}"
echo "   DASHBOARD_DOMAIN=${DASHBOARD_DOMAIN}"
echo "   LANDING_DOMAIN=${LANDING_DOMAIN}"
echo "   WIKI_DOMAIN=${WIKI_DOMAIN}"
echo "   USE_HTTPS=${USE_HTTPS}"
echo ""
echo "🔗 Generated URIs:"
echo "   API_URI=${API_URI}"
echo "   DASHBOARD_URI=${DASHBOARD_URI}"
echo "   LANDING_URI=${LANDING_URI}"
echo "   WIKI_URI=${WIKI_URI}"

# Debug: Check if API documentation was built
echo "🔍 Checking if API documentation files exist..."

# Check if openapi.local.json exists in the standalone directory
if [ -f "/app/apps/wiki/.next/standalone/apps/wiki/openapi.local.json" ]; then
  echo "   ✅ openapi.local.json found in standalone directory"

  # Check the server URL in the OpenAPI spec
  SERVER_URL=$(grep -o '"url":\s*"[^"]*"' /app/apps/wiki/.next/standalone/apps/wiki/openapi.local.json | head -1 | sed 's/"url":\s*"\([^"]*\)"/\1/')
  echo "   📍 OpenAPI server URL: $SERVER_URL"
else
  echo "   ❌ ERROR: openapi.local.json not found! API pages will not work."
fi

echo ""
echo "ℹ️  URLs are generated at runtime from domain configuration"
echo "   To use custom domains, set these environment variables:"
echo "   API_DOMAIN=api.example.com"
echo "   DASHBOARD_DOMAIN=app.example.com"
echo "   LANDING_DOMAIN=www.example.com"
echo "   WIKI_DOMAIN=docs.example.com"
echo "   USE_HTTPS=true"

# Replace URLs in built files with runtime configuration
# This approach is simpler and more reliable than window.__ENV__
replace_urls_in_app() {
  local app=$1
  local app_dir=$2

  echo "📝 Replacing URLs in $app build files..."

  # Define placeholder URLs (built into the app at compile time)
  local PLACEHOLDER_API="https://api.useplunk.com"
  local PLACEHOLDER_DASHBOARD="https://app.useplunk.com"
  local PLACEHOLDER_LANDING="https://www.useplunk.com"
  local PLACEHOLDER_WIKI="https://docs.useplunk.com"

  # Find and replace URLs in all built files
  # Process .next directory (contains all built output: static/, server/, standalone bundles)
  # Include .js, .json, .html files to catch all possible occurrences
  echo "   🔍 Scanning for files with placeholder URLs..."

  # Create a temporary file list of files that need processing
  local temp_file_list="/tmp/replace_urls_${app}.txt"

  # Search in .next directory for all file types that might contain URLs
  # Include: .js (bundles), .json (manifests), .html (static pages), .rsc (React Server Components)
  find "$app_dir/.next" -type f \( -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.rsc" \) \
    -exec grep -l -E "$PLACEHOLDER_API|$PLACEHOLDER_DASHBOARD|$PLACEHOLDER_LANDING|$PLACEHOLDER_WIKI" {} \; \
    2>/dev/null > "$temp_file_list" || true

  # Count and process files
  local file_count=$(wc -l < "$temp_file_list" | tr -d ' ')
  echo "   📊 Found $file_count files containing placeholder URLs"

  if [ "$file_count" -gt 0 ]; then
    while IFS= read -r file; do
      # Show relative path for better readability
      local rel_path="${file#$app_dir/}"
      echo "   🔄 $rel_path"

      # Replace all URLs - compatible with both GNU and BSD sed
      # Create temp file, replace, then move
      sed -e "s|$PLACEHOLDER_API|$API_URI|g" \
          -e "s|$PLACEHOLDER_DASHBOARD|$DASHBOARD_URI|g" \
          -e "s|$PLACEHOLDER_LANDING|$LANDING_URI|g" \
          -e "s|$PLACEHOLDER_WIKI|$WIKI_URI|g" \
          "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    done < "$temp_file_list"

    echo "   ✅ Successfully replaced URLs in $file_count files"
  else
    echo "   ⚠️  No files found with placeholder URLs"
  fi

  rm -f "$temp_file_list"

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

  # Also generate .env file for server-side Next.js standalone
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

# Replace URLs in all Next.js apps
replace_urls_in_app "web" "/app/apps/web/.next/standalone/apps/web"
replace_urls_in_app "landing" "/app/apps/landing/.next/standalone/apps/landing"
replace_urls_in_app "wiki" "/app/apps/wiki/.next/standalone/apps/wiki"

echo "📋 Starting services with PM2..."

# Create PM2 ecosystem file with environment variables
cat > /tmp/ecosystem.config.js << PMEOF
module.exports = {
  apps: [
    {
      name: 'nginx',
      script: 'nginx',
      args: '-g "daemon off;"',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false
    },
    {
      name: 'api',
      script: '/app/apps/api/dist/app.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        API_URI: '${API_URI}',
        DASHBOARD_URI: '${DASHBOARD_URI}',
        LANDING_URI: '${LANDING_URI}',
        WIKI_URI: '${WIKI_URI}'
      }
    },
    {
      name: 'worker',
      script: '/app/apps/api/dist/jobs/worker.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        API_URI: '${API_URI}',
        DASHBOARD_URI: '${DASHBOARD_URI}',
        LANDING_URI: '${LANDING_URI}',
        WIKI_URI: '${WIKI_URI}'
      }
    },
    {
      name: 'smtp',
      script: '/app/apps/smtp/dist/server.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        API_URI: '${API_URI}',
        SMTP_DOMAIN: '${SMTP_DOMAIN:-}',
        PORT_SECURE: '465',
        PORT_SUBMISSION: '587',
        MAX_RECIPIENTS: '${MAX_RECIPIENTS:-5}',
        CERT_PATH: '/certs',
        ACME_JSON_PATH: '/certs/acme.json'
      }
    },
    {
      name: 'web',
      script: 'apps/web/server.js',
      cwd: '/app/apps/web/.next/standalone',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        API_URI: '${API_URI}',
        DASHBOARD_URI: '${DASHBOARD_URI}',
        LANDING_URI: '${LANDING_URI}',
        WIKI_URI: '${WIKI_URI}'
      }
    },
    {
      name: 'landing',
      script: 'apps/landing/server.js',
      cwd: '/app/apps/landing/.next/standalone',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOSTNAME: '0.0.0.0',
        API_URI: '${API_URI}',
        DASHBOARD_URI: '${DASHBOARD_URI}',
        LANDING_URI: '${LANDING_URI}',
        WIKI_URI: '${WIKI_URI}'
      }
    },
    {
      name: 'wiki',
      script: 'apps/wiki/server.js',
      cwd: '/app/apps/wiki/.next/standalone',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 1000,
        HOSTNAME: '0.0.0.0',
        API_URI: '${API_URI}',
        DASHBOARD_URI: '${DASHBOARD_URI}',
        LANDING_URI: '${LANDING_URI}',
        WIKI_URI: '${WIKI_URI}'
      }
    }
  ]
};
PMEOF

# Display configuration summary
echo ""
echo "✅ Configuration complete!"
echo ""
echo "🌐 Your Plunk instance will be available at:"
echo "   API: http://${API_DOMAIN}"
echo "   Dashboard: http://${DASHBOARD_DOMAIN}"
echo "   Landing: http://${LANDING_DOMAIN}"
echo "   Docs: http://${WIKI_DOMAIN}"
echo ""
echo "🚀 Starting all services..."
echo ""

# Start all services with PM2
exec pm2-runtime start /tmp/ecosystem.config.js
