/**
 * ITSA Platform: Security, Sanitization & Data Integrity Utilities
 */

/**
 * Sanitizes URLs to prevent XSS and malicious protocol injection.
 * Returns null if the URL uses an unsafe protocol (e.g. javascript:, data:, vbscript:).
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  // Block dangerous pseudo-protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    console.warn('Blocked potentially unsafe URL protocol:', trimmed);
    return null;
  }

  // Allow standard protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }

  // Prepend https for naked domain paths
  return `https://${trimmed}`;
}

/**
 * Strips any potential script or HTML tags from plaintext strings.
 */
export function sanitizePlainText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}
