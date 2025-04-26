# AVIFlip Template Configuration Guide

This template allows you to create image conversion applications with customized branding and features.

## How to Configure Your App

1. **Site Configuration**
   - Edit `client/src/config.ts` to set your:
     - Site name
     - Default conversion direction
     - Color scheme
     - Domain name
     - Logo text

2. **Conversion Settings**
   - The template supports AVIF, JPG, and PNG formats
   - Default compression levels can be adjusted in `client/src/workers/conversion.worker.ts`

3. **UI Customization**
   - Edit `client/src/components/Header.tsx` for the header appearance
   - Edit `client/src/components/Footer.tsx` for the footer content
   - Main conversion interface is in `client/src/components/DropConvert.tsx`

## Creating a New Site Based on This Template

1. Copy the entire project directory
2. Update the `config.ts` file with your new site's information:
   ```typescript
   const yourSiteConfig: SiteConfig = {
     siteName: 'YourSiteName',
     defaultConversionMode: 'jpgToAvif', // or 'avifToJpg'
     primaryColor: '#HEX_COLOR', 
     secondaryColor: '#HEX_COLOR',
     accentColor: '#HEX_COLOR',
     logoText: 'YourLogoText',
     domain: 'yourdomain.com'
   };
   ```
3. Add your site to the site detection logic in the `getSiteConfig()` function

## Deployment Instructions

1. For GitHub + Cloudflare deployment:
   - Update the repository URL in `push_to_github.sh`
   - Connect your Cloudflare Pages to the GitHub repository

2. For manual Cloudflare deployment:
   - Use `prepare-for-cloudflare.sh` to create a deployment package
   - Upload the resulting ZIP file to Cloudflare Pages

3. Build settings for Cloudflare:
   - Build command: `npm run build`
   - Build output directory: `dist/public`