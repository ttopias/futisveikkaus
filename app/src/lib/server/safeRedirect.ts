/**
 * Validates a post-auth redirect target. Only same-origin relative paths are allowed.
 */
export function safeRedirectPath(next: string | null | undefined, defaultPath = '/'): string {
  if (!next || typeof next !== 'string') {
    return defaultPath;
  }

  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultPath;
  }
  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return defaultPath;
  }

  return trimmed;
}
