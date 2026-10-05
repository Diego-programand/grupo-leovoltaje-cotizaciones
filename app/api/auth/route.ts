import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const COOKIE_NAME = 'leovoltaje_admin_token';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PIN || 'leovoltaje-secure-secret-2026';

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS && now > entry.lockedUntil) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function generateSignedToken(remember: boolean): string {
  const expiry = Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
  const payload = `admin:${expiry}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

function verifySignedToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [role, expiryStr, signature] = parts;
    if (role !== 'admin') return false;

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    const expectedPayload = `${role}:${expiryStr}`;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(expectedPayload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token || !verifySignedToken(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();

  const entry = rateLimitMap.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };

  if (entry.lockedUntil > now) {
    const remainingSecs = Math.ceil((entry.lockedUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        message: `Demasiados intentos. Acceso bloqueado. Reintenta en ${Math.ceil(remainingSecs / 60)} min.`,
        locked: true,
      },
      { status: 429 }
    );
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAttempt = now;
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Petición inválida.' }, { status: 400 });
    }

    const { pin, remember } = body;
    if (typeof pin !== 'string' || pin.length === 0 || pin.length > 100) {
      return NextResponse.json({ success: false, message: 'PIN inválido.' }, { status: 400 });
    }

    const correctPin = (process.env.ADMIN_PIN || 'leovoltaje2026').trim();
    const isMatch = timingSafeCompare(pin.trim(), correctPin);

    if (!isMatch) {
      entry.count += 1;
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - entry.count);

      if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_MS;
        rateLimitMap.set(ip, entry);
        return NextResponse.json(
          { success: false, message: 'Acceso bloqueado por seguridad.', locked: true },
          { status: 429 }
        );
      }

      rateLimitMap.set(ip, entry);
      return NextResponse.json(
        { success: false, message: `PIN incorrecto. Te quedan ${remainingAttempts} intento(s).` },
        { status: 401 }
      );
    }

    rateLimitMap.delete(ip);

    const signedToken = generateSignedToken(Boolean(remember));
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const isProd = process.env.NODE_ENV === 'production';
    const cookieString = `${COOKIE_NAME}=${encodeURIComponent(signedToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`;

    const response = NextResponse.json({ success: true });
    response.headers.append('Set-Cookie', cookieString);
    return response;
  } catch {
    return NextResponse.json({ success: false, message: 'Error interno.' }, { status: 500 });
  }
}

export async function DELETE() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieString = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', cookieString);
  return response;
}
