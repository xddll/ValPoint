import { ImageBedConfig, ImageBedProvider } from '../types/imageBed';

export type ImageBedFieldType = 'text' | 'select' | 'switch';

export type ImageBedField = {
  key: keyof ImageBedConfig;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: ImageBedFieldType;
  options?: Array<{ label: string; value: string }>;
  helper?: string;
};

export type ImageBedProviderDefinition = {
  provider: ImageBedProvider;
  label: string;
  description: string;
  fields: ImageBedField[];
  defaultConfig: ImageBedConfig;
};

const aliyunDefinition: ImageBedProviderDefinition = {
  provider: 'aliyun',
  label: '阿里云 OSS',
  description: '使用阿里云对象存储作为图床',
  defaultConfig: {
    provider: 'aliyun',
    _configName: '',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    area: '',
    path: '',
    customUrl: '',
    region: '',
    basePath: '',
    customDomain: '',
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'accessKeyId', label: 'accessKeyId', required: true },
    { key: 'accessKeySecret', label: 'accessKeySecret', required: true },
    { key: 'bucket', label: '存储空间名', required: true },
    { key: 'area', label: '存储区域代号', required: true, placeholder: '如：oss-cn-hangzhou' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
    { key: 'customUrl', label: '自定义域名', placeholder: '需包含 http:// 或 https://' },
  ],
};

const tencentDefinition: ImageBedProviderDefinition = {
  provider: 'tencent',
  label: '腾讯云 COS',
  description: '使用腾讯云 COS 作为图床',
  defaultConfig: {
    provider: 'tencent',
    _configName: '',
    secretId: '',
    secretKey: '',
    bucket: '',
    appId: '',
    area: '',
    path: '',
    customUrl: '',
    version: 'v5',
    options: '',
    slim: false,
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'secretId', label: 'secretId', required: true },
    { key: 'secretKey', label: 'secretKey', required: true },
    { key: 'bucket', label: '存储桶名', required: true, placeholder: '注意 v4/v5 版本命名差异' },
    { key: 'appId', label: 'appId', required: true, placeholder: '例如：1250000000' },
    { key: 'area', label: '存储区域', required: true, placeholder: '如：ap-beijing-1' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
    { key: 'customUrl', label: '自定义域名', placeholder: '需包含 http:// 或 https://' },
    {
      key: 'version',
      label: 'COS 版本',
      type: 'select',
      options: [
        { label: 'v5', value: 'v5' },
        { label: 'v4', value: 'v4' },
      ],
      required: true,
    },
    { key: 'options', label: '网站后缀', placeholder: '如：imageMogr2/thumbnail/500x500' },
    { key: 'slim', label: '开启极智压缩', type: 'switch' },
  ],
};

const qiniuDefinition: ImageBedProviderDefinition = {
  provider: 'qiniu',
  label: '七牛云',
  description: '使用七牛云对象存储作为图床',
  defaultConfig: {
    provider: 'qiniu',
    _configName: '',
    accessKey: '',
    secretKey: '',
    bucket: '',
    url: '',
    area: '',
    options: '',
    path: '',
  },
  fields: [
    { key: '_configName', label: '配置名称', required: true, placeholder: '用于区分不同图床配置' },
    { key: 'accessKey', label: 'accessKey', required: true },
    { key: 'secretKey', label: 'secretKey', required: true },
    { key: 'bucket', label: '存储空间名', required: true },
    { key: 'url', label: '访问网址', required: true },
    { key: 'area', label: '存储区域编号', required: true },
    { key: 'options', label: '网址后缀', placeholder: '如：imgslim' },
    { key: 'path', label: '自定义存储路径', placeholder: '如：img/' },
  ],
};

export const imageBedProviderDefinitions: ImageBedProviderDefinition[] = [
  aliyunDefinition,
  tencentDefinition,
  qiniuDefinition,
];

export const imageBedProviderMap: Record<ImageBedProvider, ImageBedProviderDefinition> = imageBedProviderDefinitions.reduce(
  (acc, def) => {
    acc[def.provider] = def;
    return acc;
  },
  {} as Record<ImageBedProvider, ImageBedProviderDefinition>,
);

export const defaultImageBedConfig = imageBedProviderDefinitions[0].defaultConfig;
