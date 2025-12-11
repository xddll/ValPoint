import OSS from 'ali-oss';
import { ImageBedConfig } from '../types/imageBed';

type UploadProgressHandler = (percent: number) => void;

export type TransferOptions = {
  onUploadProgress?: UploadProgressHandler;
};

const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');

const ensureProcessParams = (processParams?: string) => {
  if (!processParams) return '';
  if (processParams.startsWith('?') || processParams.startsWith('&')) return processParams;
  return `?${processParams}`;
};

const ensureHttps = (url: string) => url.replace(/^http:\/\//i, 'https://');

const pad = (num: number, len = 2) => num.toString().padStart(len, '0');

const buildDateSegments = () => {
  const d = new Date();
  return [d.getFullYear().toString(), pad(d.getMonth() + 1), pad(d.getDate())];
};

const buildTimestampName = () => {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds()) +
    pad(d.getMilliseconds(), 3)
  );
};

const buildObjectKey = (basePath: string | undefined, extension: string) => {
  const prefix = trimSlashes(basePath || '');
  const fileName = `${buildTimestampName()}.${extension}`;
  // 需求：与现有格式保持一致，如 img_share/20251207214644055.png
  if (prefix) return `${prefix}/${fileName}`;
  const dateSegments = buildDateSegments();
  return [...dateSegments, fileName].join('/');
};

const appendTimestamp = (url: string) => {
  const hasQuery = url.includes('?');
  return `${url}${hasQuery ? '&' : '?'}t=${Date.now()}`;
};

const pickExtension = (blob: Blob, originalUrl: string) => {
  if (blob.type?.includes('/')) {
    const ext = blob.type.split('/').pop();
    if (ext) return ext;
  }
  const clean = originalUrl.split('#')[0].split('?')[0];
  const parts = clean.split('.');
  if (parts.length > 1) {
    const extFromUrl = parts.pop();
    if (extFromUrl && extFromUrl.length <= 5) return extFromUrl;
  }
  return 'png';
};

const createOssClient = (config: ImageBedConfig) => {
  const { accessKeyId, accessKeySecret, bucket, region } = config;
  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    throw new Error('MISSING_CONFIG');
  }
  return new OSS({
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    secure: true,
    timeout: 60000,
  });
};

const buildPublicUrl = (config: ImageBedConfig, objectKey: string) => {
  const baseUrl = (config.customDomain || `https://${config.bucket}.${config.region}.aliyuncs.com`).replace(/\/+$/g, '');
  const endpointPath = trimSlashes(config.endpointPath || '');
  const path = [endpointPath, objectKey].filter(Boolean).join('/');
  return `${ensureHttps(baseUrl)}/${path}${ensureProcessParams(config.processParams)}`;
};

const uploadWithRetry = async (client: OSS, objectKey: string, blob: Blob, onProgress?: UploadProgressHandler) => {
  const useMultipart = blob.size > 4 * 1024 * 1024;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (useMultipart) {
        const result = await client.multipartUpload(objectKey, blob, {
          progress: (percent: number) => {
            if (onProgress) onProgress(Math.min(100, Math.max(0, Math.round(percent * 100))));
          },
          partSize: 512 * 1024,
          timeout: 60000,
        });
        return result;
      }
      // 小文件直接 PUT，避免多分片超时
      const putResult = await client.put(objectKey, blob);
      if (onProgress) onProgress(100);
      return putResult;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.warn('[ossTransfer] upload retry', { objectKey, attempt, err });
    }
  }
  throw new Error('UPLOAD_RETRY_FAILED');
};

export const uploadBlobToOss = async (
  blob: Blob,
  config: ImageBedConfig,
  options: { onProgress?: UploadProgressHandler; extensionHint?: string } = {},
) => {
  const client = createOssClient(config);
  const extension = options.extensionHint || pickExtension(blob, '');
  const objectKey = buildObjectKey(config.basePath, extension);
  const result = await uploadWithRetry(client, objectKey, blob, options.onProgress);
  const finalKey = (result as any).name || objectKey;
  const url = buildPublicUrl(config, finalKey);
  return { url, objectKey: finalKey };
};

export const downloadImageBlob = async (sourceUrl: string) => {
  const urlWithTs = appendTimestamp(sourceUrl);
  const response = await fetch(urlWithTs, { method: 'GET', mode: 'cors', cache: 'no-store' });
  if (!response.ok) throw new Error(`DOWNLOAD_${response.status}`);
  const blob = await response.blob();
  const extension = pickExtension(blob, sourceUrl);
  return { blob, extension };
};

export const transferImageFromUrl = async (sourceUrl: string, config: ImageBedConfig, options: TransferOptions = {}) => {
  const { blob, extension } = await downloadImageBlob(sourceUrl);
  const { url } = await uploadBlobToOss(blob, config, { extensionHint: extension, onProgress: options.onUploadProgress });
  return ensureHttps(url);
};
