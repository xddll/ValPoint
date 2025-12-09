// @ts-nocheck
import { useCallback } from 'react';
import { upsertShared } from '../services/shared';
import { findLineupByClone } from '../services/lineups';
import { uploadToOss } from '../utils/ossUpload';

const toShortShareId = (uuid: string) => {
  if (!uuid) return '';
  const parts = uuid.split('-');
  if (parts.length === 5) return `${parts[3]}-${parts[4]}`;
  return uuid;
};

type Params = {
  lineups: any[];
  userId: string | null;
  isGuest: boolean;
  getMapEnglishName: (name: string) => string;
  setAlertMessage: (msg: string | null) => void;
  setAlertActionLabel: (label: string | null) => void;
  setAlertAction: (fn: (() => void) | null) => void;
  setIsSharing: (v: boolean) => void;
  saveNewLineup: (payload: any) => Promise<void>;
  fetchLineups: (userId: string | null) => Promise<void>;
  handleTabSwitch: (tab: string) => void;
  imageBedConfig: any;
  openImageBedConfig: () => void;
  isSavingShared: boolean;
  setIsSavingShared: (v: boolean) => void;
  updateLineup: (id: string, payload: any) => Promise<void>;
  onTransferStart: (count: number) => void;
  onTransferProgress: (delta: number) => void;
};

export const useShareActions = ({
  lineups,
  userId,
  isGuest,
  getMapEnglishName,
  setAlertMessage,
  setAlertActionLabel,
  setAlertAction,
  setIsSharing,
  saveNewLineup,
  fetchLineups,
  handleTabSwitch,
  imageBedConfig,
  openImageBedConfig,
  isSavingShared,
  setIsSavingShared,
  updateLineup,
  onTransferStart,
  onTransferProgress,
}: Params) => {
  const handleShare = useCallback(
    async (id: string) => {
      const lineup = lineups.find((l) => l.id === id);
      if (!lineup) {
        setAlertMessage('未找到要分享的点位');
        return;
      }
      // 若该点位来自共享库副本，提示直接使用原分享，避免重复数据
      if (lineup.clonedFrom) {
        const originalShareId = toShortShareId(lineup.clonedFrom);
        setAlertActionLabel('复制原分享ID');
        setAlertAction(() => () => {
          const textArea = document.createElement('textarea');
          textArea.value = originalShareId;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            setAlertMessage('已复制原分享ID');
          } catch (err) {
            setAlertMessage(`请手动复制原分享ID：${originalShareId}`);
          }
          document.body.removeChild(textArea);
          setAlertActionLabel(null);
          setAlertAction(null);
        });
        setAlertMessage('该点位来自共享库，直接使用原分享ID即可，无需再次分享。');
        return;
      }
      setAlertActionLabel(null);
      setAlertAction(null);
      const shareId = toShortShareId(id);
      const payload = {
        share_id: shareId,
        source_id: id,
        ...{
          title: lineup.title,
          map_name: getMapEnglishName(lineup.mapName),
          agent_name: lineup.agentName,
          agent_icon: lineup.agentIcon,
          skill_icon: lineup.skillIcon,
          side: lineup.side,
          ability_index: lineup.abilityIndex,
          agent_pos: lineup.agentPos,
          skill_pos: lineup.skillPos,
          stand_img: lineup.standImg,
          stand_desc: lineup.standDesc,
          stand2_img: lineup.stand2Img,
          stand2_desc: lineup.stand2Desc,
          aim_img: lineup.aimImg,
          aim_desc: lineup.aimDesc,
          aim2_img: lineup.aim2Img,
          aim2_desc: lineup.aim2Desc,
          land_img: lineup.landImg,
          land_desc: lineup.landDesc,
          source_link: lineup.sourceLink,
          user_id: userId,
          cloned_from: lineup.clonedFrom || null,
        },
        created_at: lineup.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        setIsSharing(true);
        await upsertShared(payload);
        const textArea = document.createElement('textarea');
        textArea.value = shareId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setAlertMessage('分享 ID 已复制，好友可直接预览。\n提示：分享库数据会在 15 天后自动清理，请及时保存到个人库。');
        } catch (err) {
          setAlertMessage('复制失败，请手动复制 ID：\n' + shareId + '\n提示：分享库数据会在 15 天后自动清理，请及时保存到个人库。');
        }
        document.body.removeChild(textArea);
      } catch (err) {
        console.error(err);
        setAlertMessage('分享失败，请重试');
      } finally {
        setAlertActionLabel(null);
        setAlertAction(null);
        setIsSharing(false);
      }
    },
    [lineups, userId, getMapEnglishName, setAlertMessage, setAlertActionLabel, setAlertAction, setIsSharing],
  );

  const hasAnyImage = (target: any) =>
    !!(target?.standImg || target?.stand2Img || target?.aimImg || target?.aim2Img || target?.landImg);

  const ensureImageBedConfigured = () => {
    const required = ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    const missing = required.filter((key) => !imageBedConfig?.[key]);
    if (!missing.length) return true;
    openImageBedConfig?.();
    setAlertActionLabel(null);
    setAlertAction(null);
    setAlertMessage('检测到未配置图床，已为你打开配置面板，请填写后再尝试转存图片。');
    return false;
  };

  const getExtFromUrl = (url: string, mime = '') => {
    const clean = (url || '').split('?')[0].split('#')[0];
    const parts = clean.split('.');
    const extFromUrl = parts.length > 1 ? parts.pop() : '';
    if (extFromUrl && extFromUrl.length <= 5) return extFromUrl;
    if (mime.includes('/')) return mime.split('/').pop() || 'png';
    return 'png';
  };

  const isOssUrl = (url: string) => {
    try {
      const u = new URL(url);
      const hostParts = u.hostname.split('.');
      if (hostParts.length < 3) return null;
      const [, region] = hostParts;
      const bucket = hostParts[0];
      const key = u.pathname.replace(/^\/+/, '');
      if (!bucket || !region || !key) return null;
      return { bucket, region, key };
    } catch (e) {
      return null;
    }
  };

  const buildTimestampName = () => {
    const d = new Date();
    const pad = (num: number, len = 2) => num.toString().padStart(len, '0');
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

  const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');

  const buildObjectKey = (basePath: string, filename: string) => {
    const prefix = trimSlashes(basePath);
    return [prefix, filename].filter(Boolean).join('/');
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const signString = async (value: string, secret: string) => {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
    return arrayBufferToBase64(signature);
  };

  const copyOssObject = async (sourceUrl: string, extHint: string) => {
    const source = isOssUrl(sourceUrl);
    if (!source) return null;
    const { accessKeyId, accessKeySecret, bucket, region, basePath, endpointPath, customDomain, processParams } = imageBedConfig || {};
    if (!accessKeyId || !accessKeySecret || !bucket || !region) return null;

    const filename = `${buildTimestampName()}.${extHint || 'png'}`;
    const objectKey = buildObjectKey(basePath || '', filename);
    const date = new Date().toUTCString();
    const copySource = `/${source.bucket}/${source.key}`;
    const canonicalHeaders = [`x-oss-copy-source:${copySource}`, 'x-oss-forbid-overwrite:true'].join('\n');
    const canonicalResource = `/${bucket}/${objectKey}`;
    const stringToSign = ['PUT', '', '', date, `${canonicalHeaders}\n${canonicalResource}`].join('\n');
    const signature = await signString(stringToSign, accessKeySecret);
    const auth = `OSS ${accessKeyId}:${signature}`;
    const uploadHost = `https://${bucket}.${region}.aliyuncs.com`;
    const targetUrl = `${uploadHost}/${objectKey}`;

    const resp = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Authorization: auth,
        Date: date,
        'x-oss-copy-source': copySource,
        'x-oss-forbid-overwrite': 'true',
      },
    });
    if (!resp.ok && resp.status !== 200 && resp.status !== 201) {
      return null;
    }

    const baseUrl = (customDomain || uploadHost).replace(/\/+$/g, '');
    const path = [trimSlashes(endpointPath || ''), objectKey].filter(Boolean).join('/');
    const finalUrl = `${baseUrl}/${path}${processParams ? (processParams.startsWith('?') || processParams.startsWith('&') ? processParams : `?${processParams}`) : ''}`;
    return finalUrl;
  };

  const fetchWithTimeout = async (url: string, options: any, timeoutMs = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  };

  const fetchImageBlob = async (url: string, preferProxy = false) => {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
    // 若已知直连慢/失败，直接走代理
    if (preferProxy) {
      const resp = await fetchWithTimeout(proxyUrl, {}, 10000);
      if (!resp.ok) throw new Error(`PROXY_DOWNLOAD_${resp.status}`);
      console.info('[transfer] proxy fetch ok', proxyUrl);
      return await resp.blob();
    }
    try {
      const directResp = await fetchWithTimeout(url, { referrer: 'no-referrer' }, 8000);
      if (!directResp.ok) throw new Error(`DOWNLOAD_${directResp.status}`);
      console.info('[transfer] direct fetch ok', url);
      return await directResp.blob();
    } catch (err) {
      console.warn('[transfer] direct fetch failed, try proxy', url, err);
      const resp = await fetchWithTimeout(proxyUrl, {}, 10000);
      if (!resp.ok) throw new Error(`PROXY_DOWNLOAD_${resp.status}`);
      console.info('[transfer] proxy fetch ok', proxyUrl);
      return await resp.blob();
    }
  };

  const transferImagesToOwnBed = async (target: any, onStep?: () => void) => {
    const fields = ['standImg', 'stand2Img', 'aimImg', 'aim2Img', 'landImg'];
    const replaced: Record<string, string> = {};
    const failed: string[] = [];
    const cache = new Map<string, string>();
    let directFetchAvailable = true;
    let allowOssCopy = true; // 同区域时尝试一次 copy，避免跨区域 403 拖慢

    const tasks = fields.map(async (key) => {
      const url = target?.[key];
      if (!url) return;
      if (cache.has(url)) {
        replaced[key] = cache.get(url) as string;
        onStep?.();
        return;
      }
      try {
        // 仅当源是 OSS 且区域与目标一致时尝试服务器端拷贝
        if (allowOssCopy) {
          const srcInfo = isOssUrl(url);
          const destRegion = imageBedConfig?.region;
          if (srcInfo && destRegion && srcInfo.region === destRegion) {
            try {
              const extHint = getExtFromUrl(url, '');
              const copied = await copyOssObject(url, extHint);
              if (copied) {
                console.info('[transfer] oss copy success', { src: url, dest: copied });
                cache.set(url, copied);
                replaced[key] = copied;
                return;
              }
            } catch (err) {
              console.warn('[transfer] oss copy failed, fallback to fetch', url, err);
              allowOssCopy = false; // 避免同批后续继续尝试 copy 拖时间
            }
          }
        }
        const blob = await (async () => {
          if (!directFetchAvailable) {
            return fetchImageBlob(url, true); // 直连已有失败，直接代理
          }
          try {
            return await fetchImageBlob(url);
          } catch (err) {
            directFetchAvailable = false;
            throw err;
          }
        })();
        const ext = getExtFromUrl(url, blob.type);
        const file = new File([blob], `shared_${key}_${Date.now()}.${ext}`, { type: blob.type || 'application/octet-stream' });
        const { url: newUrl } = await uploadToOss(file, imageBedConfig);
        console.info('[transfer] frontend upload success', { src: url, dest: newUrl });
        cache.set(url, newUrl);
        replaced[key] = newUrl;
      } catch (err) {
        console.error('转存图片失败', key, url, err);
        failed.push(key);
      } finally {
        onStep?.();
      }
    });

    await Promise.all(tasks);
    return { replaced, failed };
  };

  const normalizeImageKeysForDb = (data: Record<string, string>) => {
    const keyMap: Record<string, string> = {
      standImg: 'stand_img',
      stand2Img: 'stand2_img',
      aimImg: 'aim_img',
      aim2Img: 'aim2_img',
      landImg: 'land_img',
    };
    const result: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      const dbKey = keyMap[k];
      if (dbKey) result[dbKey] = v;
    });
    return result;
  };

  const handleSaveShared = useCallback(
    async (lineupToSave: any, fallbackSharedLineup: any) => {
      if (isGuest) {
        setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
        return;
      }
      if (!userId) {
        setAlertMessage('请先登录再保存点位');
        return;
      }
      if (isSavingShared) return;
      setIsSavingShared(true);
      setAlertActionLabel(null);
      setAlertAction(null);
      const target = lineupToSave || fallbackSharedLineup;
      if (!target) {
        setIsSavingShared(false);
        return;
      }
      try {
        const existing = await findLineupByClone(userId, target.id);
        if (existing) {
          setAlertMessage('你已经保存过这个共享点位，无需重复添加。');
          handleTabSwitch('view');
          fetchLineups(userId);
          return;
        }
        const mapNameEn = getMapEnglishName(target.mapName);
        const { id, ...data } = target;
        const payloadData = { ...data };

        const payload = {
          title: payloadData.title,
          map_name: mapNameEn,
          agent_name: payloadData.agentName,
          agent_icon: payloadData.agentIcon,
          skill_icon: payloadData.skillIcon,
          side: payloadData.side,
          ability_index: payloadData.abilityIndex ?? null,
          agent_pos: payloadData.agentPos,
          skill_pos: payloadData.skillPos,
          stand_img: payloadData.standImg,
          stand_desc: payloadData.standDesc,
          stand2_img: payloadData.stand2Img,
          stand2_desc: payloadData.stand2Desc,
          aim_img: payloadData.aimImg,
          aim_desc: payloadData.aimDesc,
          aim2_img: payloadData.aim2Img,
          aim2_desc: payloadData.aim2Desc,
          land_img: payloadData.landImg,
          land_desc: payloadData.landDesc,
          source_link: payloadData.sourceLink,
          user_id: userId,
          cloned_from: id,
          created_at: new Date().toISOString(),
        };
        const inserted = await saveNewLineup(payload);

        // 后台异步转存：保存原链接立即完成，图片再替换
        const imageCount = ['standImg', 'stand2Img', 'aimImg', 'aim2Img', 'landImg'].filter((k) => payloadData[k]).length;
        if (imageCount) {
          onTransferStart(imageCount);
          if (ensureImageBedConfigured() && inserted?.id) {
            (async () => {
              try {
                const { replaced, failed } = await transferImagesToOwnBed(data, () => onTransferProgress(-1));
                if (Object.keys(replaced).length) {
                  const dbReplaced = normalizeImageKeysForDb(replaced);
                  await updateLineup(inserted.id, { ...dbReplaced, updated_at: new Date().toISOString() });
                  await fetchLineups(userId);
                }
                if (failed.length) {
                  setAlertMessage('部分图片转存失败，已保留原链接。');
                }
              } catch (err) {
                console.error('后台转存失败', err);
              }
            })();
          } else {
            // 配置缺失或无 ID，立即抵消计数
            onTransferProgress(-imageCount);
          }
        }

        setAlertMessage('已保存，图片后台同步中…');
        handleTabSwitch('view');
        fetchLineups(userId);
      } catch (err) {
        console.error(err);
        setAlertMessage('保存失败，请重试。');
      } finally {
        setIsSavingShared(false);
      }
    },
    [
      isGuest,
      getMapEnglishName,
      saveNewLineup,
      userId,
      handleTabSwitch,
      fetchLineups,
      setAlertMessage,
      isSavingShared,
      setIsSavingShared,
      imageBedConfig,
      openImageBedConfig,
    ],
  );

  return { handleShare, handleSaveShared };
};
