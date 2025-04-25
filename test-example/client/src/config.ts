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

// Configuration for TestFlip
const testflipConfig: SiteConfig = {
  siteName: 'TestFlip',
  defaultConversionMode: 'avifToJpg',
  primaryColor: '#dc2626',
  secondaryColor: '#b91c1c',
  accentColor: '#f87171',
  logoText: 'TestFlip',
  domain: 'testflip.com'
};

// Determine which configuration to use
export function getSiteConfig(): SiteConfig {
  return testflipConfig;
}

// Export the current site configuration
export const siteConfig = getSiteConfig();
