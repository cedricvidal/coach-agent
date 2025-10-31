// Utility functions for checking user permissions from Auth0 tokens

interface JWTPayload {
  permissions?: string[];
  scope?: string;
  [key: string]: any;
}

/**
 * Decode a JWT token (without verification - verification happens on backend)
 * This is safe for client-side permission checks as it only affects UI display
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a user has a specific permission
 * Checks both the permissions array and scope string
 */
export function hasPermission(token: string, permission: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return false;

  // Check permissions array (RBAC enabled)
  if (Array.isArray(payload.permissions)) {
    return payload.permissions.includes(permission);
  }

  // Check scope string (fallback)
  if (typeof payload.scope === 'string') {
    const scopes = payload.scope.split(' ');
    return scopes.includes(permission);
  }

  return false;
}

/**
 * Get all permissions from a token
 */
export function getPermissions(token: string): string[] {
  const payload = decodeJWT(token);
  if (!payload) return [];

  // Return permissions array if available
  if (Array.isArray(payload.permissions)) {
    return payload.permissions;
  }

  // Parse scope string as fallback
  if (typeof payload.scope === 'string') {
    return payload.scope.split(' ').filter(Boolean);
  }

  return [];
}
