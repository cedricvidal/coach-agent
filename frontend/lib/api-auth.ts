// Backend API Authentication Utilities for Next.js API Routes
import { auth } from 'express-oauth2-jwt-bearer';
import { NextRequest, NextResponse } from 'next/server';

// Auth0 JWT validation middleware configuration
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

// Extract and validate Auth0 token from Next.js request
export async function validateAuth0Token(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token
    const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`);
    // In production, use proper JWT verification library
    // For now, we'll fetch user info to validate the token

    const userInfoResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userInfoResponse.ok) {
      return { error: 'Invalid token', status: 401 };
    }

    const userInfo = await userInfoResponse.json();

    return {
      auth0Id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      token
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { error: 'Token validation failed', status: 401 };
  }
}

// Check if user has specific permission
export async function checkPermission(token: string, permission: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return false;

    const userInfo = await response.json();
    const permissions = userInfo.permissions || [];

    return permissions.includes(permission);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Auth0 UserInfo response type
export interface Auth0UserInfo {
  sub: string;
  email: string;
  name?: string;
  [key: string]: any;
}

// Fetch user info from Auth0
export async function fetchAuth0UserInfo(accessToken: string): Promise<Auth0UserInfo> {
  const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info from Auth0');
  }

  return response.json() as Promise<Auth0UserInfo>;
}
