import { useEffect, useMemo, useState } from 'react';
import { OssSignedUrlItem, requestOssSignedUrls } from '../lib/oss/signedUrlsClient';

type CacheEntry = { signedUrl: string; expiresAt: number };
const cacheBySource = new Map<string, CacheEntry>();

const isCacheValid = (entry: CacheEntry) => entry.expiresAt - Date.now() > 10_000;

const normalizeSources = (sources: Array<string | null | undefined>) => {
  const uniq = new Set<string>();
  for (const raw of sources) {
    const v = typeof raw === 'string' ? raw.trim() : '';
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
};

export type UseOssSignedUrlsResult = {
  getUrl: (source: string) => string;
  isLoading: boolean;
  error: string | null;
};

export const useOssSignedUrls = (
  sources: Array<string | null | undefined>,
  options: { expiresIn?: number } = {},
): UseOssSignedUrlsResult => {
  const normalized = useMemo(() => normalizeSources(sources), [sources]);
  const normalizedKey = useMemo(() => normalized.join('|'), [normalized]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!normalized.length) return;

    const toFetch = normalized.filter((source) => {
      const cached = cacheBySource.get(source);
      return !cached || !isCacheValid(cached);
    });
    if (!toFetch.length) return;

    const controller = new AbortController();
    const token = import.meta.env.VITE_OSS_SIGN_TOKEN as string | undefined;
    const endpoint = import.meta.env.VITE_OSS_SIGN_ENDPOINT as string | undefined;

    setIsLoading(true);
    setError(null);

    requestOssSignedUrls(toFetch, { expiresIn: options.expiresIn, token, endpoint, signal: controller.signal })
      .then((resp) => {
        for (const item of resp.items) {
          cacheBySource.set(item.source, { signedUrl: item.signedUrl, expiresAt: item.expiresAt });
        }
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'OSS_SIGN_FAILED');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [normalizedKey, options.expiresIn]);

  const getUrl = (source: string) => {
    const cached = cacheBySource.get(source);
    if (cached && isCacheValid(cached)) return cached.signedUrl;
    return source;
  };

  return { getUrl, isLoading, error };
};

export const toSignedImageList = (sources: Array<string | null | undefined>, getUrl: (source: string) => string) =>
  sources
    .map((src) => (typeof src === 'string' ? src.trim() : ''))
    .filter((src): src is string => !!src)
    .map((src) => getUrl(src));

export const toSignedImageItem = (source: string, getUrl: (source: string) => string): OssSignedUrlItem['signedUrl'] =>
  getUrl(source);
