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

// Configuration for WebPFlip
const webpflipConfig: SiteConfig = {
  siteName: 'WebPFlip',
  defaultConversionMode: 'jpgToWebp~',
  primaryColor: '#9333ea',
  secondaryColor: '#7e22ce',
  accentColor: '#a855f7',
  logoText: 'WebPFlip',
  domain: 'webpflip.com'
};

// Determine which configuration to use
export function getSiteConfig(): SiteConfig {
  return webpflipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();
