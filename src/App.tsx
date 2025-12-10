import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from './constants/maps';
import { defaultImageBedConfig } from './components/ImageBedConfigModal';
import { useAuth } from './hooks/useAuth';
import { useLineups } from './hooks/useLineups';
import { useSharedLineups } from './hooks/useSharedLineups';
import { useLineupActions } from './hooks/useLineupActions';
import { useShareActions } from './hooks/useShareActions';
import { useValorantData } from './hooks/useValorantData';
import { useLineupFiltering } from './hooks/useLineupFiltering';
import { useModalState } from './hooks/useModalState';
import { getAbilityIcon } from './utils/abilityIcons';
import Lightbox from './components/Lightbox';
import AlertModal from './components/AlertModal';
import SharedLineupView from './features/shared/SharedLineupView';
import MainView from './features/lineups/MainView';
import AppModals from './features/lineups/AppModals';
import { createEmptyLineup, toDbPayload } from './features/lineups/lineupHelpers';
import { AgentOption, MapOption, BaseLineup, SharedLineup, NewLineupForm, LineupPosition, LineupSide } from './types/lineup';

type ActiveTab = 'view' | 'create' | 'shared';
type LibraryMode = 'personal' | 'shared';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('view');
  const [selectedSide, setSelectedSide] = useState<'all' | 'attack' | 'defense'>('all');
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
  const { maps, agents, selectedMap, setSelectedMap, selectedAgent, setSelectedAgent } = useValorantData();
  const {
    isMapModalOpen,
    setIsMapModalOpen,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewInput,
    setPreviewInput,
    isEditorOpen,
    setIsEditorOpen,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    deleteTargetId,
    setDeleteTargetId,
    alertMessage,
    setAlertMessage,
    alertActionLabel,
    setAlertActionLabel,
    alertAction,
    setAlertAction,
    alertSecondaryLabel,
    setAlertSecondaryLabel,
    alertSecondaryAction,
    setAlertSecondaryAction,
    viewingImage,
    setViewingImage,
    isChangelogOpen,
    setIsChangelogOpen,
  } = useModalState();
  const mapNameZhToEn = useMemo<Record<string, string>>(() => {
    const reverse: Record<string, string> = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);
  const { lineups, setLineups, fetchLineups } = useLineups(mapNameZhToEn);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
  const [viewingLineup, setViewingLineup] = useState<BaseLineup | null>(null);
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null);
  const [sharedLineup, setSharedLineup] = useState<SharedLineup | null>(null);
  const { sharedLineups, setSharedLineups, fetchSharedLineups, fetchSharedById } = useSharedLineups(mapNameZhToEn);
  const { saveNewLineup, updateLineup, deleteLineup, clearLineups } = useLineupActions();
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('personal');
  const [newLineupData, setNewLineupData] = useState<NewLineupForm>(createEmptyLineup());
  const [placingType, setPlacingType] = useState<'agent' | 'skill' | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isSavingShared, setIsSavingShared] = useState<boolean>(false);
  const [pendingTransfers, setPendingTransfers] = useState<number>(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<boolean>(false);
  const [isImageConfigOpen, setIsImageConfigOpen] = useState<boolean>(false);
  const [imageBedConfig, setImageBedConfig] = useState(defaultImageBedConfig);
  const {
    userId,
    userMode,
    isGuest,
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingUserId,
    setPendingUserId,
    customUserIdInput,
    setCustomUserIdInput,
    passwordInput,
    setPasswordInput,
    isAuthLoading,
    targetUserId,
    handleApplyCustomUserId,
    handleResetUserId,
    handleConfirmUserAuth,
  } = useAuth({
    onAuthSuccess: async () => {},
    setAlertMessage,
  });
  const getMapDisplayName = (apiMapName: string) => MAP_TRANSLATIONS[apiMapName] || apiMapName;
  const getMapEnglishName = (displayName: string) =>
    Object.keys(MAP_TRANSLATIONS).find((key) => MAP_TRANSLATIONS[key] === displayName) || displayName;
  const mapCoverOverrides: Record<string, string> = {
    Abyss: 'https://game.gtimg.cn/images/val/agamezlk/map/abyss/cover.PNG',
  };

  const getMapCoverUrl = () => {
    const enName = selectedMap ? getMapEnglishName(selectedMap.displayName) : '';
    const key = enName ? enName.toLowerCase() : '';
    const template = key ? `https://game.gtimg.cn/images/val/agamezlk/map/${key}/cover.PNG` : null;
    return (enName && mapCoverOverrides[enName]) || template || selectedMap?.displayIcon || getMapUrl() || null;
  };

  const { agentCounts, filteredLineups, sharedFilteredLineups, isFlipped, mapLineups } = useLineupFiltering({
    lineups,
    sharedLineups,
    libraryMode,
    selectedMap,
    selectedAgent,
    selectedSide,
    selectedAbilityIndex,
    searchQuery,
    activeTab,
    sharedLineup,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) setActiveTab('shared');
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchLineups(userId);
  }, [fetchLineups, userId]);

  useEffect(() => {
    if (!userId) return;
    setLineups([]);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setSharedLineup(null);
    setEditingLineupId(null);
    setIsEditorOpen(false);
    setPlacingType(null);
    setNewLineupData(createEmptyLineup());
    setActiveTab('view');
  }, [userId]);

  useEffect(() => {
    setSelectedLineupId(null);
    setViewingLineup(null);
  }, [libraryMode]);

  useEffect(() => {
    if (libraryMode === 'shared') fetchSharedLineups();
  }, [libraryMode, fetchSharedLineups]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('valpoint_imagebed_config');
      if (saved) setImageBedConfig({ ...defaultImageBedConfig, ...JSON.parse(saved) });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('id');
    if (!shareId) return;
    const load = async () => {
    const lineup = await fetchSharedById(shareId);
      if (!lineup) {
        setAlertMessage('未找到该点位分享，可能已被删除。');
        setActiveTab('view');
        return;
      }
      setSharedLineup(lineup);
    };
    load();
  }, [fetchSharedById]);

  const handlePreviewSubmit = async (): Promise<void> => {
    if (!previewInput.trim()) return;
    let idToLoad = previewInput.trim();
    try {
      const url = new URL(idToLoad);
      const idParam = url.searchParams.get('id');
      if (idParam) idToLoad = idParam;
    } catch (e) {}
    const lineup = await fetchSharedById(idToLoad);
    if (!lineup) return setAlertMessage('未找到该 ID 对应的点位。');
    setSharedLineup(lineup);
    setActiveTab('shared');
    setIsPreviewModalOpen(false);
    setPreviewInput('');
  };

  const handleTabSwitch = (tab: ActiveTab) => {
    if (isGuest && tab === 'create') {
      setAlertMessage('游客模式仅支持查看，如需新增或编辑请设置密码进入登录模式');
      return;
    }
    setActiveTab(tab);
    setPlacingType(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setEditingLineupId(null);
    setSharedLineup(null);
    if (tab === 'create') setLibraryMode('personal');
    if (tab !== 'shared') {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
    if (tab === 'create') {
      setNewLineupData(createEmptyLineup());
      if (selectedSide === 'all') setSelectedSide('attack');
    } else if (tab === 'view') {
      // 请先在地图上完成标注?￡?????δ请先在地图上完成标注标题不能为空????
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      if (!selectedAgent) {
        const firstAgent = agents[0];
        if (firstAgent) setSelectedAgent(firstAgent);
      }
      fetchLineups(userId);
    }
  };

  const handleOpenEditor = () => {
    if (isGuest) {
      setAlertMessage('游客模式仅支持查看，填写密码进入登录模式后才能新增或编辑点位');
      return;
    }
    if (!selectedMap) return setAlertMessage('请先选择地图');
    if (!newLineupData.agentPos || !newLineupData.skillPos) return setAlertMessage('请先在地图上完成标注');
    if (!selectedAgent) return setAlertMessage('请先选择一名特工');
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingLineupId(null);
    setNewLineupData(createEmptyLineup());
    setPlacingType(null);
    setActiveTab('view');
    setSelectedSide('all');
    setSelectedAbilityIndex(null);
    setSelectedLineupId(null);
    setViewingLineup(null);
  };

  const handleEditStart = (lineup: BaseLineup) => {
    if (isGuest) {
      setAlertMessage('游客模式无法编辑点位，请先输入密码切换到登录模式');
      return;
    }
    const mapObj = maps.find((m) => getMapDisplayName(m.displayName) === lineup.mapName || m.displayName === lineup.mapName);
    if (mapObj) setSelectedMap(mapObj);
    const agentObj = agents.find((a) => a.displayName === lineup.agentName);
    if (agentObj) setSelectedAgent(agentObj);
    setSelectedSide(lineup.side);
    setSelectedAbilityIndex(lineup.abilityIndex);
    setNewLineupData({
      title: lineup.title,
      agentPos: lineup.agentPos,
      skillPos: lineup.skillPos,
      standImg: lineup.standImg || '',
      standDesc: lineup.standDesc || '',
      stand2Img: lineup.stand2Img || '',
      stand2Desc: lineup.stand2Desc || '',
      aimImg: lineup.aimImg || '',
      aimDesc: lineup.aimDesc || '',
      aim2Img: lineup.aim2Img || '',
      aim2Desc: lineup.aim2Desc || '',
      landImg: lineup.landImg || '',
      landDesc: lineup.landDesc || '',
      sourceLink: lineup.sourceLink || '',
      enableStand2: !!(lineup.stand2Img || lineup.stand2Desc),
      enableAim2: !!(lineup.aim2Img || lineup.aim2Desc),
    });
    setEditingLineupId(lineup.id);
    setViewingLineup(null);
    setActiveTab('create');
    setPlacingType(null);
    setIsEditorOpen(true);
  };

  const handleEditorSave = async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法保存点位，请先输入密码切换到登录模式');
      return;
    }
    if (!userId) {
      setAlertMessage('请先登录再保存点位');
      return;
    }
    if (!selectedMap || !selectedAgent) {
      setAlertMessage('请先选择地图和特工');
      return;
    }
    if (selectedAbilityIndex === null) {
      setAlertMessage('请先选择技能');
      return;
    }
    if (!newLineupData.title.trim()) return setAlertMessage('标题不能为空');
    const cleaned = {
      ...newLineupData,
      stand2Img: newLineupData.enableStand2 ? newLineupData.stand2Img : '',
      stand2Desc: newLineupData.enableStand2 ? newLineupData.stand2Desc : '',
      aim2Img: newLineupData.enableAim2 ? newLineupData.aim2Img : '',
      aim2Desc: newLineupData.enableAim2 ? newLineupData.aim2Desc : '',
    };
    const commonData = {
      title: cleaned.title,
      mapName: selectedMap.displayName,
      agentName: selectedAgent.displayName,
      agentIcon: selectedAgent.displayIcon || null,
      skillIcon: getAbilityIcon(selectedAgent, selectedAbilityIndex),
      side: selectedSide as LineupSide,
      abilityIndex: selectedAbilityIndex,
      agentPos: cleaned.agentPos,
      skillPos: cleaned.skillPos,
      standImg: cleaned.standImg,
      standDesc: cleaned.standDesc,
      stand2Img: cleaned.stand2Img,
      stand2Desc: cleaned.stand2Desc,
      aimImg: cleaned.aimImg,
      aimDesc: cleaned.aimDesc,
      aim2Img: cleaned.aim2Img,
      aim2Desc: cleaned.aim2Desc,
      landImg: cleaned.landImg,
      landDesc: cleaned.landDesc,
      sourceLink: cleaned.sourceLink,
      clonedFrom: null,
    };
    try {
      if (editingLineupId) {
        await updateLineup(editingLineupId, {
          ...toDbPayload(commonData, userId!),
          updated_at: new Date().toISOString(),
        });
        setAlertMessage('更新成功，如已分享，请重新分享以同步共享库');
      } else {
        await saveNewLineup({ ...toDbPayload(commonData, userId!), created_at: new Date().toISOString() });
        setAlertMessage('保存成功');
      }
      setIsEditorOpen(false);
      setEditingLineupId(null);
      setNewLineupData(createEmptyLineup());
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setPlacingType(null);
      setActiveTab('view');
      fetchLineups(userId);
    } catch (e) {
      console.error(e);
      setAlertMessage('保存失败');
    }
  };

  const handleRequestDelete = (id: string, e?: React.MouseEvent) => {
    if (isGuest) {
      e?.stopPropagation();
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    e?.stopPropagation();
    setDeleteTargetId(id);
  };

  const performDelete = async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!deleteTargetId) return;
    try {
      await deleteLineup(deleteTargetId);
      setSelectedLineupId(null);
      setViewingLineup(null);
    } catch (e) {
      setAlertMessage('删除失败，请重试。');
    }
    setDeleteTargetId(null);
    fetchLineups(userId);
  };

  const showAlert = (msg: string | null) => setAlertMessage(msg);
  const showAlertActionLabel = (label: string | null) => setAlertActionLabel(label);
  const showAlertAction = (fn: (() => void) | null) => setAlertAction(fn);
  const showAlertSecondaryLabel = (label: string | null) => setAlertSecondaryLabel(label);
  const showAlertSecondaryAction = (fn: (() => void) | null) => setAlertSecondaryAction(fn);

  const { handleShare, handleSaveShared } = useShareActions({
    lineups,
    userId,
    isGuest,
    getMapEnglishName,
    setAlertMessage: showAlert,
    setIsSharing,
    saveNewLineup,
    fetchLineups,
    handleTabSwitch,
    setAlertActionLabel: showAlertActionLabel,
    setAlertAction: showAlertAction,
    setAlertSecondaryLabel: showAlertSecondaryLabel,
    setAlertSecondaryAction: showAlertSecondaryAction,
    imageBedConfig,
    openImageBedConfig: () => setIsImageConfigOpen(true),
    isSavingShared,
    setIsSavingShared,
    updateLineup,
    onTransferStart: (count: number) => setPendingTransfers((v) => v + count),
    onTransferProgress: (delta: number) => setPendingTransfers((v) => Math.max(0, v + delta)),
  });
  const onShare = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      handleShare(id);
    },
    [handleShare],
  );
  const onSaveShared = useCallback(
    (lineupParam: SharedLineup | null = null) => {
      void handleSaveShared(lineupParam, sharedLineup);
    },
    [handleSaveShared, sharedLineup],
  );

  const togglePlacingType = (type: 'agent' | 'skill') => {
    if (isGuest) {
      setAlertMessage('游客模式无法标注点位，请先输入密码进入登录模式');
      return;
    }
    setPlacingType((prev) => (prev === type ? null : type));
  };

  const handleClearAll = () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!lineups.length) {
      setAlertMessage('当前没有可删除的点位。');
      return;
    }
    setIsClearConfirmOpen(true);
  };

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
    setIsAuthModalOpen(true);
  };

  const handleQuickClear = () => {
    setIsActionMenuOpen(false);
    handleClearAll();
  };

  const handleImageConfigSave = (cfg: typeof defaultImageBedConfig) => {
    setImageBedConfig(cfg);
    try {
      localStorage.setItem('valpoint_imagebed_config', JSON.stringify(cfg));
    } catch (e) {
      console.error(e);
    }
    setAlertMessage('图床配置已保存，仅当前设备生效。');
    setIsImageConfigOpen(false);
  };

  const performClearAll = async () => {
    if (!userId) return;
    try {
      await clearLineups(userId);
      setIsClearConfirmOpen(false);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setAlertMessage('已清空当前账号的点位。');
      fetchLineups(userId);
    } catch (e) {
      setAlertMessage('清空失败，请重试。');
    }
  };

  const handleViewLineup = useCallback(
    (id: string) => {
      setSelectedLineupId(id);
      const source = libraryMode === 'shared' ? sharedLineups : lineups;
      const lineup = source.find((l) => l.id === id);
      if (lineup) setViewingLineup(lineup);
    },
    [lineups, sharedLineups, libraryMode],
  );

  const getMapUrl = (): string | null => {
    if (activeTab === 'shared' && sharedLineup) {
      const enName = getMapEnglishName(sharedLineup.mapName);
      const config = (CUSTOM_MAP_URLS as Record<string, { attack: string; defense: string }>)[enName];
      if (config) return sharedLineup.side === 'defense' ? config.defense : config.attack;
    }
    if (!selectedMap) return null;
    const config = (CUSTOM_MAP_URLS as Record<string, { attack: string; defense: string }>)[selectedMap.displayName];
    if (config) return selectedSide === 'defense' ? config.defense : config.attack;
    return selectedMap.displayIcon || null;
  };

  if (activeTab === 'shared' && sharedLineup) {
    return (
      <>
        <SharedLineupView
          sharedLineup={sharedLineup}
          isSavingShared={isSavingShared}
          onSaveShared={(lineup) => void onSaveShared(lineup)}
          onBack={() => handleTabSwitch('view')}
          getMapDisplayName={getMapDisplayName}
          getMapEnglishName={getMapEnglishName}
          getMapUrl={getMapUrl}
          newLineupData={newLineupData}
          setNewLineupData={setNewLineupData}
          placingType={placingType}
          setPlacingType={setPlacingType}
          selectedAgent={selectedAgent}
          selectedAbilityIndex={selectedAbilityIndex}
          onViewLineup={handleViewLineup}
          isFlipped={isFlipped}
          setViewingImage={setViewingImage}
          quickActions={{
            isActionMenuOpen,
            onToggle: () => setIsActionMenuOpen((v) => !v),
            onImageBedConfig: handleImageBedConfig,
            onChangePassword: handleChangePassword,
            onClearLineups: handleQuickClear,
            pendingTransfers,
          }}
        />
        <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />
        <AlertModal
          message={alertMessage}
          actionLabel={alertActionLabel ?? null}
          onAction={alertAction ?? null}
          secondaryLabel={alertSecondaryLabel ?? null}
          onSecondary={alertSecondaryAction ?? null}
          onClose={() => setAlertMessage(null)}
        />
      </>
    );
  }

  return (
    <>
      <MainView
        activeTab={activeTab}
        selectedMap={selectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        agents={agents}
        agentCounts={agentCounts}
        selectedAbilityIndex={selectedAbilityIndex}
        setSelectedAbilityIndex={setSelectedAbilityIndex}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        getMapDisplayName={getMapDisplayName}
        openChangelog={() => setIsChangelogOpen(true)}
        mapIcon={getMapUrl()}
        mapCover={getMapCoverUrl()}
        lineups={mapLineups}
        selectedLineupId={selectedLineupId}
        onLineupSelect={setSelectedLineupId}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        placingType={placingType}
        setPlacingType={setPlacingType}
        onViewLineup={handleViewLineup}
        isFlipped={isFlipped}
        sharedLineup={sharedLineup}
        isActionMenuOpen={isActionMenuOpen}
        onToggleActions={() => setIsActionMenuOpen((v) => !v)}
        onImageBedConfig={handleImageBedConfig}
        onChangePassword={handleChangePassword}
        onClearLineups={handleQuickClear}
        pendingTransfers={pendingTransfers}
        libraryMode={libraryMode}
        setLibraryMode={(mode) => {
          setLibraryMode(mode);
          setSelectedLineupId(null);
          setViewingLineup(null);
        }}
        handleTabSwitch={handleTabSwitch}
        togglePlacingType={togglePlacingType}
        handleOpenEditor={handleOpenEditor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredLineups={libraryMode === 'shared' ? sharedFilteredLineups : filteredLineups}
        selectedLineupIdRight={selectedLineupId}
        handleViewLineup={handleViewLineup}
        handleShare={onShare}
        handleRequestDelete={handleRequestDelete}
        handleClearAll={handleClearAll}
        userId={userId}
        userMode={userMode}
        customUserIdInput={customUserIdInput}
        setCustomUserIdInput={setCustomUserIdInput}
        handleApplyCustomUserId={handleApplyCustomUserId}
        handleResetUserId={handleResetUserId}
      />

      <AppModals
        // auth
        isAuthModalOpen={isAuthModalOpen}
        userId={userId}
        targetUserId={targetUserId}
        passwordInput={passwordInput}
        isAuthLoading={isAuthLoading}
        onAuthClose={() => {
          if (!userId) return;
          setIsAuthModalOpen(false);
          setPendingUserId('');
          setPasswordInput('');
        }}
        onTargetUserChange={(val) => {
          setPendingUserId(val);
          setCustomUserIdInput(val);
        }}
        onResetUserId={handleResetUserId}
        onPasswordChange={(val) => setPasswordInput(val)}
        onGuestConfirm={() => handleConfirmUserAuth('')}
        onLoginConfirm={() => handleConfirmUserAuth()}
        // map picker
        isMapModalOpen={isMapModalOpen}
        maps={maps}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        getMapDisplayName={getMapDisplayName}
        // preview
        isPreviewModalOpen={isPreviewModalOpen}
        previewInput={previewInput}
        setPreviewInput={setPreviewInput}
        onPreviewClose={() => setIsPreviewModalOpen(false)}
        onPreviewSubmit={handlePreviewSubmit}
        // alerts
        alertMessage={alertMessage}
        alertActionLabel={alertActionLabel}
        alertAction={alertAction}
        alertSecondaryLabel={alertSecondaryLabel}
        alertSecondaryAction={alertSecondaryAction}
        onAlertClose={() => {
          setAlertMessage(null);
          setAlertActionLabel(null);
          setAlertAction(null);
          setAlertSecondaryLabel(null);
          setAlertSecondaryAction(null);
        }}
        setAlertMessage={setAlertMessage}
        // delete
        deleteTargetId={deleteTargetId}
        isClearConfirmOpen={isClearConfirmOpen}
        onDeleteCancel={() => setDeleteTargetId(null)}
        onDeleteConfirm={performDelete}
        onClearConfirm={performClearAll}
        // image bed
        isImageConfigOpen={isImageConfigOpen}
        imageBedConfig={imageBedConfig}
        onImageConfigClose={() => setIsImageConfigOpen(false)}
        onImageConfigSave={handleImageConfigSave}
        // editor/viewer
        isEditorOpen={isEditorOpen}
        editingLineupId={editingLineupId}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        handleEditorSave={handleEditorSave}
        onEditorClose={handleEditorClose}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        viewingLineup={viewingLineup}
        onViewerClose={() => {
          setViewingLineup(null);
          setSelectedLineupId(null);
        }}
        handleEditStart={handleEditStart}
        setViewingImage={setViewingImage}
        getMapEnglishName={getMapEnglishName}
        isGuest={isGuest}
        libraryMode={libraryMode}
        handleCopyShared={onSaveShared}
        isSavingShared={isSavingShared}
        // lightbox
        viewingImage={viewingImage}
        // changelog
        isChangelogOpen={isChangelogOpen}
        onChangelogClose={() => setIsChangelogOpen(false)}
      />
    </>
  );
}

export default App;





















