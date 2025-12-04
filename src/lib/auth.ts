import { cookies } from 'next/headers';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const COOKIE_NAME = 'ark_session';
const ALGORITHM = 'aes-256-gcm';

type SessionData = {
  endpoint: string;
  filerEndpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

function getSecret(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters');
  }
  return Buffer.from(secret.slice(0, 32), 'utf-8');
}

export function encryptSession(data: SessionData): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getSecret(), iv);

  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSession(encryptedData: string): SessionData | null {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, getSecret(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  return decryptSession(sessionCookie.value);
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encryptSession(data);

  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export type { SessionData };
