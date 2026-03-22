import { db } from './db';
import crypto from 'crypto';

// Hash password using SHA256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify password
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Generate API key
export function generateApiKey(): string {
  return `tl_${crypto.randomBytes(32).toString('hex')}`;
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// Hash content for verification
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Simple session store (in-memory for demo, use Redis in production)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

// Create session
export function createSession(userId: string): string {
  const token = generateSessionToken();
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

// Validate session
export function validateSession(token: string): string | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

// Delete session
export function deleteSession(token: string): void {
  sessions.delete(token);
}

// Get user from session cookie
export async function getUserFromSession(request: Request): Promise<{ id: string; email: string; name: string | null } | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='));
  if (!tokenCookie) return null;

  const token = tokenCookie.split('=')[1];
  const userId = validateSession(token);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  });

  return user;
}
