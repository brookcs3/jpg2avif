#!/bin/bash

# Create Project from AVIFlip Template
# Usage: ./create-project-from-template.sh <new-project-name> <site-name> <primary-color> <conversion-mode>

# Check for required arguments
if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <project-directory> <site-name> <primary-color> <conversion-mode>"
  echo "Example: $0 myproject \"My Converter\" \"#10b981\" \"jpgToAvif\""
  exit 1
fi

PROJECT_DIR="$1"
SITE_NAME="$2"
PRIMARY_COLOR="$3"
CONVERSION_MODE="$4"

# Create project directory
mkdir -p "$PROJECT_DIR"

# Copy all files except Git, node_modules, and dist
echo "Copying template files to $PROJECT_DIR..."
cp -r ./client "$PROJECT_DIR/"
cp -r ./server "$PROJECT_DIR/"
cp -r ./shared "$PROJECT_DIR/"
cp ./package.json "$PROJECT_DIR/"
cp ./package-lock.json "$PROJECT_DIR/" 2>/dev/null || :
cp ./tsconfig.json "$PROJECT_DIR/"
cp ./vite.config.ts "$PROJECT_DIR/"
cp ./tailwind.config.ts "$PROJECT_DIR/"
cp ./postcss.config.js "$PROJECT_DIR/"
cp ./drizzle.config.ts "$PROJECT_DIR/"
cp ./components.json "$PROJECT_DIR/"
cp ./.replit "$PROJECT_DIR/" 2>/dev/null || :
cp ./replit.nix "$PROJECT_DIR/" 2>/dev/null || :
cp ./README.md "$PROJECT_DIR/"

# Set reasonable default colors if you don't want to calculate them
# Secondary is a bit darker, accent is a bit lighter
if [[ "$PRIMARY_COLOR" == "#10b981" ]]; then
  # Green defaults
  SECONDARY_COLOR="#059669"
  ACCENT_COLOR="#34d399"
elif [[ "$PRIMARY_COLOR" == "#3b82f6" ]]; then
  # Blue defaults
  SECONDARY_COLOR="#2563eb"
  ACCENT_COLOR="#60a5fa"
elif [[ "$PRIMARY_COLOR" == "#dc2626" ]]; then
  # Red defaults
  SECONDARY_COLOR="#b91c1c"
  ACCENT_COLOR="#f87171"
elif [[ "$PRIMARY_COLOR" == "#9333ea" ]]; then
  # Purple defaults
  SECONDARY_COLOR="#7e22ce"
  ACCENT_COLOR="#a855f7"
elif [[ "$PRIMARY_COLOR" == "#f97316" ]]; then
  # Orange defaults
  SECONDARY_COLOR="#ea580c"
  ACCENT_COLOR="#fb923c"
else
  # Fallbacks if color isn't recognized
  SECONDARY_COLOR="$PRIMARY_COLOR"
  ACCENT_COLOR="$PRIMARY_COLOR"
fi

# Enter the project directory
cd "$PROJECT_DIR" || exit

# Clean up template-specific files
rm -f jpgflip-new-project-instructions.md
rm -f jpgflip-readme.md
rm -f README_jpgflip.md
rm -f push_jpgflip.sh
rm -f prepare-jpgflip-for-cloudflare.sh
rm -f aviflip-cloudflare-deploy.zip
rm -f create-project-from-template.sh

# Update the project name in package.json
sed -i "s/\"name\": \".*\"/\"name\": \"${SITE_NAME,,}\"/g" package.json

# Update the site config
CONFIG_FILE="client/src/config.ts"
SITE_IDENTIFIER="${SITE_NAME,,}"
SITE_IDENTIFIER_CAMEL="$(echo ${SITE_IDENTIFIER:0:1} | tr '[:lower:]' '[:upper:]')${SITE_IDENTIFIER:1}"

# Create new site configuration with parameters passed to script
cat > "$CONFIG_FILE.new" << EOF
/**
 * Site configuration
 * This file contains site-specific settings that change based on which
 * domain/brand is being displayed.
 */

// Define conversion mode type
export type ConversionMode = 'avifToJpg' | 'jpgToAvif';

// Define site configuration types
export interface SiteConfig {
  siteName: string;
  defaultConversionMode: ConversionMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoText: string;
  domain: string;
}

// Configuration for $SITE_NAME
const ${SITE_IDENTIFIER}Config: SiteConfig = {
  siteName: '$SITE_NAME',
  defaultConversionMode: '$CONVERSION_MODE',
  primaryColor: '$PRIMARY_COLOR',
  secondaryColor: '$SECONDARY_COLOR',
  accentColor: '$ACCENT_COLOR',
  logoText: '$SITE_NAME',
  domain: '${SITE_IDENTIFIER}.com'
};

// Determine which configuration to use
export function getSiteConfig(): SiteConfig {
  return ${SITE_IDENTIFIER}Config;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();
EOF

mv "$CONFIG_FILE.new" "$CONFIG_FILE"

# Update README.md
cat > "README.md" << EOF
# $SITE_NAME

A high-performance browser-based image conversion platform.

## Features

- Fast client-side image conversion
- Supports AVIF, JPG, and PNG formats
- Web Worker-based parallel processing
- Drag-and-drop interface
- Automatic download handling
- Responsive design

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## Deployment

This project is configured for deployment on Cloudflare Pages.

Build command: \`npm run build\`
Build output directory: \`dist/public\`
EOF

echo "Project created successfully at $PROJECT_DIR"
echo "Next steps:"
echo "1. cd $PROJECT_DIR"
echo "2. npm install"
echo "3. npm run dev"