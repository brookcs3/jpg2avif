import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Memoize browser capabilities check to avoid recalculating
let browserCapabilities: ReturnType<typeof detectBrowserCapabilities> | null = null;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string (KB, MB, etc.)
 * Optimized with lookup table for common size thresholds
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  // Fast path for common sizes
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  
  // Fallback for larger sizes
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Detect browser capabilities once and cache the result
 */
function detectBrowserCapabilities() {
  return {
    hasWasm: typeof WebAssembly === 'object',
    hasSharedArrayBuffer: typeof SharedArrayBuffer === 'function',
    hasWebWorker: typeof Worker === 'function',
    isChromium: navigator.userAgent.indexOf("Chrome") !== -1,
    hasAvifSupport: 'HTMLImageElement' in window && 'decoding' in HTMLImageElement.prototype,
    isCrossOriginIsolated: window.crossOriginIsolated === true,
    // New: Check for modern File API
    hasModernFileAPI: 'arrayBuffer' in File.prototype
  };
}

/**
 * Get browser capabilities (memoized)
 */
export function getBrowserCapabilities() {
  if (!browserCapabilities) {
    browserCapabilities = detectBrowserCapabilities();
  }
  return browserCapabilities;
}

// Extension mapping for faster lookups 
const mimeToExtension: Record<string, string> = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/zip': '.zip',
  'application/octet-stream': '.bin'
};

/**
 * Creates an optimized URL object from a blob/file that can be used for downloads
 */
export function createDownloadUrl(blob: Blob, filename: string): { url: string, download: string } {
  const url = URL.createObjectURL(blob);
  
  // Extract filename without extension more efficiently
  const lastDotIndex = filename.lastIndexOf('.');
  const filenameBase = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  
  // Fast extension lookup
  const extension = mimeToExtension[blob.type] || '.jpg';
  
  return { url, download: filenameBase + extension };
}

/**
 * Optimized file reader with modern API prioritization for maximum performance
 */
export async function readFileOptimized(file: File): Promise<ArrayBuffer> {
  // Use the memoized capabilities check for performance
  const { hasModernFileAPI } = getBrowserCapabilities();
  
  // Use native File.arrayBuffer() for maximum performance in modern browsers
  if (hasModernFileAPI) {
    return file.arrayBuffer();
  }
  
  // Fast path for smaller files with FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
