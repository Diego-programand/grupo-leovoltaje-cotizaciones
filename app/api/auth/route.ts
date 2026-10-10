import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

interface ActiveSession {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
  remember: boolean;
  ip: string;
}

// Control de fuerza bruta en memoria
const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

// Registro de sesiones activas y revocadas en el servidor
const activeSessions = new Map<string, ActiveSession>();
const revokedSessions = new Set<string>();

// Duraciones y tiempos de expiración
const SESSION_COOKIE_NAME = 'leovoltaje_admin_token';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PIN || 'leovoltaje-secure-secret-2026';

// Tiempos máximos absolutos
const STANDARD_MAX_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 horas para sesión normal
const REMEMBER_MAX_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000; // 14 días para "recordarme"

// Tiempos de inactividad (Idle Timeout)
const STANDARD_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas de inactividad
const REMEMBER_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 días de inactividad

// Limpieza periódica de sesiones expiradas y rate limiting
setInterval(() => {
  const now = Date.now();
  
  // Limpieza de rate limit
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS && now > entry.lockedUntil) {
      rateLimitMap.delete(ip);
    }
  }

  // Limpieza de sesiones activas vencidas
  for (const [sid, session] of activeSessions.entries()) {
    const idleTimeout = session.remember ? REMEMBER_IDLE_TIMEOUT_MS : STANDARD_IDLE_TIMEOUT_MS;
    const isExpired = now > session.expiresAt || (now - session.lastActiveAt) > idleTimeout;
    if (isExpired) {
      activeSessions.delete(sid);
      revokedSessions.delete(sid);
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

/**
 * Genera un token firmado con un identificador de sesión único (UUID v4)
 * y almacena la sesión en el registro activo del servidor.
 */
function createSession(remember: boolean, ip: string): { token: string; maxAge: number; sessionId: string } {
  const now = Date.now();
  const sessionId = crypto.randomUUID();
  const lifetime = remember ? REMEMBER_MAX_LIFETIME_MS : STANDARD_MAX_LIFETIME_MS;
  const expiresAt = now + lifetime;

  // Registrar sesión activa en el servidor
  activeSessions.set(sessionId, {
    sessionId,
    createdAt: now,
    expiresAt,
    lastActiveAt: now,
    remember,
    ip,
  });

  // Payload: versión : sessionId : fechaCreacion : fechaExpiracion : rememberFlag
  const payload = `v1:${sessionId}:${now}:${expiresAt}:${remember ? '1' : '0'}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

  const maxAgeSeconds = Math.floor(lifetime / 1000);
  return { token, maxAge: maxAgeSeconds, sessionId };
}

/**
 * Valida la autenticidad, vigencia, inactividad y estado de revocación de una sesión.
 */
function validateSession(token: string): { valid: boolean; sessionId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    
    // Formato v1 esperado: [v1, sessionId, createdAt, expiresAt, rememberFlag, signature]
    if (parts.length !== 6 || parts[0] !== 'v1') {
      return { valid: false };
    }

    const [, sessionId, createdAtStr, expiresAtStr, rememberFlag, signature] = parts;

    // Verificar si la sesión fue explícitamente revocada
    if (revokedSessions.has(sessionId)) {
      return { valid: false };
    }

    const createdAt = parseInt(createdAtStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);
    const isRemembered = rememberFlag === '1';
    const now = Date.now();

    if (isNaN(createdAt) || isNaN(expiresAt) || now > expiresAt) {
      return { valid: false };
    }

    // Verificar firma criptográfica HMAC con comparación en tiempo constante
    const payload = `v1:${sessionId}:${createdAtStr}:${expiresAtStr}:${rememberFlag}`;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValidSignature) {
      return { valid: false };
    }

    // Comprobar estado en memoria si existe
    const active = activeSessions.get(sessionId);
    if (active) {
      const idleTimeout = active.remember ? REMEMBER_IDLE_TIMEOUT_MS : STANDARD_IDLE_TIMEOUT_MS;
      if (now - active.lastActiveAt > idleTimeout) {
        // Sesión expirada por inactividad
        activeSessions.delete(sessionId);
        return { valid: false };
      }
      // Actualizar timestamp de última actividad
      active.lastActiveAt = now;
    } else {
      // Si la sesión no está en memoria pero el token criptográfico es válido y no expiró
      // (ej. tras reinicio del proceso), la registramos nuevamente
      activeSessions.set(sessionId, {
        sessionId,
        createdAt,
        expiresAt,
        lastActiveAt: now,
        remember: isRemembered,
        ip: 'restored',
      });
    }

    return { valid: true, sessionId };
  } catch {
    return { valid: false };
  }
}

/**
 * Revoca una sesión activa en el servidor a partir del token de cookie.
 */
function revokeSession(token: string | null): void {
  if (!token) return;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length === 6 && parts[0] === 'v1') {
      const sessionId = parts[1];
      activeSessions.delete(sessionId);
      revokedSessions.add(sessionId);
    }
  } catch {
    // Ignorar si el token estaba corrupto
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { valid, sessionId } = validateSession(token);
    if (!valid || !sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      sessionId: `${sessionId.slice(0, 8)}...`,
    });
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

    // Resetear rate limiting tras éxito
    rateLimitMap.delete(ip);

    // Crear sesión única con Session ID (UUID)
    const { token, maxAge, sessionId } = createSession(Boolean(remember), ip);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieString = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`;

    const response = NextResponse.json({
      success: true,
      sessionId: `${sessionId.slice(0, 8)}...`,
    });
    response.headers.append('Set-Cookie', cookieString);
    return response;
  } catch {
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    // Revocar la sesión en el servidor
    revokeSession(token);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieString = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
    const response = NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    response.headers.append('Set-Cookie', cookieString);
    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
