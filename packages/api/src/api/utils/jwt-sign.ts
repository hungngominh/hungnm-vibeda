/**
 * Minimal HS256 JWT signer using Node built-in crypto.
 * Used by public routes (e.g. admin login) that need to issue tokens
 * but are registered outside the vegabaseJwtPlugin scope.
 */
import { createHmac } from 'node:crypto';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface JwtPayload {
  sub?: string;
  roles?: string[];
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface JwtSignOptions {
  secret: string;
  expiresIn?: number; // seconds, default 8 hours
  issuer?: string;
  audience?: string;
}

export function jwtSign(payload: JwtPayload, options: JwtSignOptions): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn ?? 8 * 60 * 60;

  const claims: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };
  if (options.issuer) claims.iss = options.issuer;
  if (options.audience) claims.aud = options.audience;

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = base64url(
    createHmac('sha256', options.secret).update(signingInput).digest(),
  );

  return `${signingInput}.${signature}`;
}
