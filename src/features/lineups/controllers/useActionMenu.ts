import { useEffect, useState } from 'react';
import { defaultImageBedConfig } from '../../../components/ImageBedConfigModal';
import { ImageBedConfig } from '../../../types/imageBed';
import { useImageProcessingSettings } from '../../../hooks/useImageProcessingSettings';
import { ImageProcessingSettings } from '../../../types/imageProcessing';
import { imageBedProviderMap } from '../../../constants/imageBedProviders';

type Params = {
  userId: string | null;
  setAlertMessage: (msg: string) => void;
  setIsAuthModalOpen: (val: boolean) => void;
  setPendingUserId: (val: string) => void;
  setCustomUserIdInput: (val: string) => void;
  setPasswordInput: (val: string) => void;
  handleClearAll: () => void;
  setIsChangePasswordOpen: (v: boolean) => void;
};

export function useActionMenu({
  userId,
  setAlertMessage,
  setIsAuthModalOpen,
  setPendingUserId,
  setCustomUserIdInput,
  setPasswordInput,
  handleClearAll,
  setIsChangePasswordOpen,
}: Params) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isImageConfigOpen, setIsImageConfigOpen] = useState(false);
  const [isImageProcessingOpen, setIsImageProcessingOpen] = useState(false);
  const [imageBedConfig, setImageBedConfig] = useState<ImageBedConfig>(defaultImageBedConfig);
  const { settings: imageProcessingSettings, saveSettings: saveImageProcessingSettings } = useImageProcessingSettings();

  const normalizeImageBedConfig = (raw: ImageBedConfig): ImageBedConfig => {
    const providerCandidate = raw?.provider;
    const provider =
      providerCandidate && imageBedProviderMap[providerCandidate]
        ? providerCandidate
        : defaultImageBedConfig.provider;
    const base = imageBedProviderMap[provider]?.defaultConfig || defaultImageBedConfig;
    const merged: ImageBedConfig = {
      ...base,
      ...raw,
      provider,
      _configName: raw?._configName || (raw as { name?: string })?.name || base._configName,
    };
    if (provider === 'aliyun') {
      if (!merged.area && merged.region) merged.area = merged.region;
      if (merged.area && !merged.region) merged.region = merged.area;
      if (merged.path && !merged.basePath) merged.basePath = merged.path;
      if (merged.customUrl && !merged.customDomain) merged.customDomain = merged.customUrl;
    }
    return merged;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('valpoint_imagebed_config');
      if (saved) setImageBedConfig(normalizeImageBedConfig(JSON.parse(saved)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleImageBedConfig = () => {
    setIsActionMenuOpen(false);
    setIsImageConfigOpen(true);
  };

  const handleChangePassword = () => {
    if (!userId) {
      setAlertMessage('请先创建或登录一个 ID，再修改密码');
      setIsAuthModalOpen(true);
      return;
    }
    setIsActionMenuOpen(false);
    setPendingUserId(userId);
    setCustomUserIdInput(userId);
    setPasswordInput('');
    setIsImageProcessingOpen(true);
  };

  const handleQuickClear = () => {
    setIsActionMenuOpen(false);
    handleClearAll();
  };

  const handleImageConfigSave = (cfg: ImageBedConfig) => {
    const normalized = normalizeImageBedConfig(cfg);
    setImageBedConfig(normalized);
    try {
      localStorage.setItem('valpoint_imagebed_config', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
    setAlertMessage('图床配置已保存，仅当前设备生效');
    setIsImageConfigOpen(false);
  };

  const handleOpenAdvancedSettings = () => {
    setIsActionMenuOpen(false);
    setIsImageProcessingOpen(true);
  };

  const handleImageProcessingSave = (cfg: ImageProcessingSettings) => {
    saveImageProcessingSettings(cfg);
    setAlertMessage('高级设置已保存，仅当前设备生效');
    setIsImageProcessingOpen(false);
  };

  return {
    isActionMenuOpen,
    setIsActionMenuOpen,
    isImageConfigOpen,
    setIsImageConfigOpen,
    isImageProcessingOpen,
    setIsImageProcessingOpen,
    imageBedConfig,
    setImageBedConfig,
    imageProcessingSettings,
    handleImageBedConfig,
    handleOpenAdvancedSettings,
    handleChangePassword,
    handleQuickClear,
    handleImageConfigSave,
    handleImageProcessingSave,
  };
}
