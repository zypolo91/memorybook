import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

const nonAsciiRegex = /[^\x00-\x7F]/;
const encodedSegmentRegex = /^__u8hex_([0-9a-fA-F]+)__(.*)$/;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return adminClient;
}

export function getSupabaseStorageBucket(): string {
  return (
    process.env.SUPABASE_STORAGE_BUCKET ||
    process.env.SUPABASE_UPLOADS_BUCKET ||
    'admin'
  );
}

export function getSupabaseStoragePrefix(): string {
  return process.env.SUPABASE_STORAGE_PREFIX || '';
}

function encodeUtf8HexSegment(segment: string): string {
  const hex = Buffer.from(segment, 'utf8').toString('hex');
  return `__u8hex_${hex}__`;
}

export function toStorageKey(path: string): string {
  if (!path) return '';
  const normalized = normalizeStoragePath(path);
  return normalized
    .split('/')
    .map((segment) => {
      if (!segment) return segment;
      if (!nonAsciiRegex.test(segment)) return segment;
      return encodeUtf8HexSegment(segment);
    })
    .join('/');
}

export function fromStorageKey(value: string): string {
  if (!value) return '';
  const parts = value.split('/').filter((p) => p.length > 0);
  const decoded = parts.map((segment) => {
    const match = segment.match(encodedSegmentRegex);
    if (!match) return segment;
    const [, hex, suffix] = match;
    if (!hex || hex.length % 2 !== 0) return segment;
    try {
      const raw = Buffer.from(hex, 'hex').toString('utf8');
      return `${raw}${suffix || ''}`;
    } catch {
      return segment;
    }
  });
  return decoded.join('/');
}

export function normalizeStoragePath(path: string): string {
  const trimmed = path.trim().replace(/\\/g, '/');
  const noLeadingSlash = trimmed.replace(/^\/+/, '');
  const parts = noLeadingSlash.split('/').filter(Boolean);

  if (parts.some((p) => p === '.' || p === '..')) {
    throw new Error('Invalid path');
  }

  return parts.join('/');
}

export function buildObjectPath(dir: string, name: string): string {
  const safeDir = dir ? normalizeStoragePath(dir) : '';
  const safeName = normalizeStoragePath(name);
  return safeDir ? `${safeDir}/${safeName}` : safeName;
}

export function applyStoragePrefix(path: string): string {
  const prefix = getSupabaseStoragePrefix();
  const safePrefix = prefix ? toStorageKey(prefix) : '';
  const safePath = path ? toStorageKey(path) : '';
  if (!safePrefix) return safePath;
  return safePath ? `${safePrefix}/${safePath}` : safePrefix;
}
