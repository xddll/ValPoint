import OSS from 'ali-oss';
import type { Plugin } from 'vite';

type Env = Record<string, string | undefined>;

const readBody = async (req: import('http').IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
};

const json = (res: import('http').ServerResponse, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const normalizeObjectKey = (source: string) => {
  if (/^https?:\/\//i.test(source)) {
    const url = new URL(source);
    return decodeURIComponent(url.pathname).replace(/^\/+/, '');
  }
  return source.replace(/^\/+/, '');
};

const parseAllowedPrefixes = (env: Env) => {
  const multi = env.OSS_ALLOWED_PREFIXES;
  if (multi) {
    return multi
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = env.OSS_ALLOWED_PREFIX || 'img_share/';
  return [single];
};

export const viteOssSignedUrlsDevPlugin = (env: Env): Plugin => {
  return {
    name: 'valpoint:oss-signed-urls-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/oss-signed-urls', async (req, res, next) => {
        if (!req.url) return next();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'content-type,x-oss-sign-token,x-share-token');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });

        const bucket = env.OSS_BUCKET;
        const region = env.OSS_REGION;
        const accessKeyId = env.OSS_ACCESS_KEY_ID;
        const accessKeySecret = env.OSS_ACCESS_KEY_SECRET;
        if (!bucket || !region || !accessKeyId || !accessKeySecret) {
          return json(res, 500, { error: 'MISSING_OSS_ENV' });
        }

        const expectedToken = env.OSS_SIGN_TOKEN;
        if (expectedToken) {
          const provided = (req.headers['x-oss-sign-token'] || req.headers['x-share-token']) as string | undefined;
          if (!provided || provided !== expectedToken) return json(res, 401, { error: 'UNAUTHORIZED' });
        }

        const raw = await readBody(req).catch(() => '');
        let parsed: unknown;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          return json(res, 400, { error: 'INVALID_BODY' });
        }

        const urls = (parsed as any)?.urls;
        const expiresInInput = (parsed as any)?.expiresIn;
        if (!Array.isArray(urls)) return json(res, 400, { error: 'INVALID_BODY' });
        if (urls.length > 5) return json(res, 400, { error: 'TOO_MANY_URLS' });

        const expiresIn = Math.min(60 * 60, Math.max(30, Math.floor(typeof expiresInInput === 'number' ? expiresInInput : 15 * 60)));
        const expiresAt = Date.now() + expiresIn * 1000;
        const allowedPrefixes = parseAllowedPrefixes(env);

        const client = new OSS({ bucket, region, accessKeyId, accessKeySecret, secure: true, timeout: 30000 });
        const items = urls
          .filter((u) => typeof u === 'string' && u.trim().length > 0)
          .map((source) => String(source))
          .map((source) => {
            const objectKey = normalizeObjectKey(source);
            if (!allowedPrefixes.some((prefix) => objectKey.startsWith(prefix))) return null;
            const signedUrl = client.signatureUrl(objectKey, { expires: expiresIn, method: 'GET' });
            return { source, signedUrl, expiresAt };
          })
          .filter(Boolean);

        return json(res, 200, { items, expiresIn });
      });
    },
  };
};
