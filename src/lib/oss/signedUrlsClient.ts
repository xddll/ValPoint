export type OssSignedUrlItem = {
  source: string;
  signedUrl: string;
  expiresAt: number;
};

export type OssSignedUrlResponse = {
  items: OssSignedUrlItem[];
  expiresIn: number;
};

type RequestOptions = {
  expiresIn?: number;
  token?: string;
  endpoint?: string;
  signal?: AbortSignal;
};

export const requestOssSignedUrls = async (sources: string[], options: RequestOptions = {}): Promise<OssSignedUrlResponse> => {
  const endpoint = (options.endpoint || '/api/oss-signed-urls').replace(/\/+$/g, '');
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { 'x-oss-sign-token': options.token } : {}),
    },
    body: JSON.stringify({ urls: sources, expiresIn: options.expiresIn }),
    signal: options.signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OSS_SIGN_${resp.status}${text ? `:${text}` : ''}`);
  }

  const data = (await resp.json()) as unknown;
  if (!data || typeof data !== 'object') throw new Error('OSS_SIGN_INVALID_RESPONSE');

  return data as OssSignedUrlResponse;
};
