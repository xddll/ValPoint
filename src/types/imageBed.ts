export type ImageBedConfig = {
  name: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  basePath?: string;
  endpointPath?: string;
  customDomain?: string;
  processParams?: string;
};
