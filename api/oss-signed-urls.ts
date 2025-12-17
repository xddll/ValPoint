import OSS from 'ali-oss';

declare const process: {
  env: Record<string, string | undefined>;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];

type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: JsonValue) => void;
  setHeader: (name: string, value: string) => void;
};

type SignedUrlItem = {
  source: string;
  signedUrl: string;
  expiresAt: number;
};

type SignedUrlResponse = {
  items: SignedUrlItem[];
  expiresIn: number;
};

const parseRequestBody = (body: unknown): { urls: string[]; expiresIn?: number } | null => {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { urls: string[]; expiresIn?: number };
    } catch {
      return null;
    }
  }
  if (typeof body === 'object') {
    return body as { urls: string[]; expiresIn?: number };
  }
  return null;
};

const pickFirstHeader = (value: string | string[] | undefined) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
};

const getClientIp = (req: RequestLike) => {
  const xf = pickFirstHeader(req.headers?.['x-forwarded-for']);
  if (xf) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

type RateState = { count: number; resetAtSec: number };
const rateStateByKey = new Map<string, RateState>();

const checkRateLimit = (key: string, limit: number, windowSec: number) => {
  const current = nowSeconds();
  const existing = rateStateByKey.get(key);
  if (!existing || existing.resetAtSec <= current) {
    const next: RateState = { count: 1, resetAtSec: current + windowSec };
    rateStateByKey.set(key, next);
    return { allowed: true, remaining: limit - 1, resetAtSec: next.resetAtSec };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAtSec: existing.resetAtSec };
  }
  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAtSec: existing.resetAtSec };
};

const normalizeObjectKey = (source: string) => {
  if (/^https?:\/\//i.test(source)) {
    const url = new URL(source);
    return decodeURIComponent(url.pathname).replace(/^\/+/, '');
  }
  return source.replace(/^\/+/, '');
};

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`MISSING_ENV:${key}`);
  return value;
};

const parseAllowedPrefixes = () => {
  const multi = process.env.OSS_ALLOWED_PREFIXES;
  if (multi) {
    return multi
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = process.env.OSS_ALLOWED_PREFIX || 'img_share/';
  return [single];
};

const getAllowedOrigin = (origin: string | undefined) => {
  const allowed = process.env.OSS_CORS_ORIGINS;
  if (!allowed) return '*';
  if (!origin) return 'null';
  const list = allowed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes('*')) return '*';
  return list.includes(origin) ? origin : 'null';
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  const originHeader = pickFirstHeader(req.headers?.origin);
  const allowOrigin = getAllowedOrigin(originHeader);
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-oss-sign-token,x-share-token');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).json(null);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const expectedToken = process.env.OSS_SIGN_TOKEN;
  if (expectedToken) {
    const provided = pickFirstHeader(req.headers?.['x-oss-sign-token']) || pickFirstHeader(req.headers?.['x-share-token']);
    if (!provided || provided !== expectedToken) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
  }

  const ip = getClientIp(req);
  const rateKey = `ip:${ip}`;
  const { allowed, resetAtSec } = checkRateLimit(rateKey, 120, 60);
  if (!allowed) {
    res.setHeader('Retry-After', String(Math.max(1, resetAtSec - nowSeconds())));
    return res.status(429).json({ error: 'RATE_LIMITED' });
  }

  const parsed = parseRequestBody(req.body);
  if (!parsed || !Array.isArray(parsed.urls)) {
    return res.status(400).json({ error: 'INVALID_BODY' });
  }

  const urls = parsed.urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  if (urls.length === 0) return res.status(200).json({ items: [], expiresIn: 0 });
  if (urls.length > 5) return res.status(400).json({ error: 'TOO_MANY_URLS' });

  const expiresIn = Math.min(60 * 60, Math.max(30, Math.floor(parsed.expiresIn ?? 15 * 60)));
  const expiresAt = Date.now() + expiresIn * 1000;

  const bucket = requireEnv('OSS_BUCKET');
  const region = requireEnv('OSS_REGION');
  const accessKeyId = requireEnv('OSS_ACCESS_KEY_ID');
  const accessKeySecret = requireEnv('OSS_ACCESS_KEY_SECRET');
  const allowedPrefixes = parseAllowedPrefixes();

  const client = new OSS({
    bucket,
    region,
    accessKeyId,
    accessKeySecret,
    secure: true,
    timeout: 30000,
  });

  const items: SignedUrlItem[] = [];

  for (const source of urls) {
    const objectKey = normalizeObjectKey(source);
    if (!allowedPrefixes.some((prefix) => objectKey.startsWith(prefix))) continue;

    const signedUrl = client.signatureUrl(objectKey, { expires: expiresIn, method: 'GET' });
    items.push({ source, signedUrl, expiresAt });
  }

  const response: SignedUrlResponse = { items, expiresIn };
  return res.status(200).json(response);
}
