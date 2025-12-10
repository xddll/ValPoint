import { ActiveTab } from '../../../types/app';
import { AgentOption, BaseLineup, MapOption, NewLineupForm, SharedLineup } from '../../../types/lineup';
import { createEmptyLineup } from '../lineupHelpers';

type Params = {
  isGuest: boolean;
  activeTab: ActiveTab;
  agents: AgentOption[];
  selectedAgent: AgentOption | null;
  selectedSide: 'all' | 'attack' | 'defense';
  previewInput: string;
  setActiveTab: (tab: ActiveTab) => void;
  setPlacingType: (val: 'agent' | 'skill' | null) => void;
  setSelectedLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewingLineup: React.Dispatch<React.SetStateAction<BaseLineup | null>>;
  setEditingLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setSharedLineup: (lineup: SharedLineup | null) => void;
  setLibraryMode: React.Dispatch<React.SetStateAction<'personal' | 'shared'>>;
  setNewLineupData: React.Dispatch<React.SetStateAction<NewLineupForm>>;
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  setSelectedAbilityIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<AgentOption | null>>;
  fetchLineups: (userId: string | null) => Promise<void>;
  userId: string | null;
  setIsPreviewModalOpen: (open: boolean) => void;
  setPreviewInput: (val: string) => void;
  fetchSharedById: (id: string) => Promise<SharedLineup | null>;
  setAlertMessage: (msg: string | null) => void;
  setSelectedMap: (map: MapOption | null) => void;
};

export function useViewController({
  isGuest,
  activeTab,
  agents,
  selectedAgent,
  selectedSide,
  previewInput,
  setActiveTab,
  setPlacingType,
  setSelectedLineupId,
  setViewingLineup,
  setEditingLineupId,
  setSharedLineup,
  setLibraryMode,
  setNewLineupData,
  setSelectedSide,
  setSelectedAbilityIndex,
  setSelectedAgent,
  fetchLineups,
  userId,
  setIsPreviewModalOpen,
  setPreviewInput,
  fetchSharedById,
  setAlertMessage,
  setSelectedMap,
}: Params) {
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
      setSelectedSide('all');
      setSelectedAbilityIndex(null);
      if (!selectedAgent) {
        const firstAgent = agents[0];
        if (firstAgent) setSelectedAgent(firstAgent);
      }
      fetchLineups(userId);
    }
  };

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
    setSelectedMap({ displayName: lineup.mapName, displayIcon: lineup.agentIcon || undefined });
    setSharedLineup(lineup);
    setActiveTab('shared');
    setIsPreviewModalOpen(false);
    setPreviewInput('');
  };

  return {
    handleTabSwitch,
    handlePreviewSubmit,
  };
}
