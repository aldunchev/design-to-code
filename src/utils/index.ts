// Utility functions for the Figma extractor

export function extractFileKeyFromUrl(url: string): string | null {
  const figmaUrlPattern = /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/;
  const match = url.match(figmaUrlPattern);
  return match ? match[1] : null;
}

export function isValidFigmaFileKey(fileKey: string): boolean {
  // Figma file keys are typically alphanumeric strings
  return /^[a-zA-Z0-9]+$/.test(fileKey) && fileKey.length > 10;
}

export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toISOString();
  } catch {
    return new Date().toISOString();
  }
}
