import { ImageBedConfig } from '../types/imageBed';
import { uploadBlobToOss } from '../lib/ossTransfer';

const inferExtension = (file: File | Blob) => {
  if ('name' in file && file.name) {
    const extFromName = file.name.split('.').pop();
    if (extFromName) return extFromName;
  }
  if (file.type?.includes('/')) {
    const extFromType = file.type.split('/').pop();
    if (extFromType) return extFromType;
  }
  return 'png';
};

export const uploadToOss = async (file: File | Blob, config: ImageBedConfig) => {
  const extensionHint = inferExtension(file);
  return uploadBlobToOss(file, config, { extensionHint });
};

export type { ImageBedConfig } from '../types/imageBed';
