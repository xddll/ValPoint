import React from 'react';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import LibrarySwitch from '../../components/LibrarySwitch';
import LeftPanel from '../../components/LeftPanel';
import RightPanel from '../../components/RightPanel';
import { BaseLineup, SharedLineup, AgentOption, MapOption } from '../../types/lineup';

type Props = {
  activeTab: 'view' | 'create' | 'shared';
  // left panel
  selectedMap: MapOption | null;
  setIsMapModalOpen: (v: boolean) => void;
  selectedSide: 'all' | 'attack' | 'defense';
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  selectedAgent: AgentOption | null;
  setSelectedAgent: (v: AgentOption | null) => void;
  agents: AgentOption[];
  agentCounts: Record<string, number>;
  selectedAbilityIndex: number | null;
  setSelectedAbilityIndex: (v: number | null) => void;
  setIsPreviewModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
  // map area
  mapIcon: string | null;
  mapCover: string | null;
  lineups: BaseLineup[];
  selectedLineupId: string | null;
  onLineupSelect: (id: string | null) => void;
  newLineupData: any;
  setNewLineupData: (fn: (prev: any) => any) => void;
  placingType: 'agent' | 'skill' | null;
  setPlacingType: React.Dispatch<React.SetStateAction<'agent' | 'skill' | null>>;
  onViewLineup: (id: string) => void;
  isFlipped: boolean;
  sharedLineup: SharedLineup | null;
  // quick actions
  isActionMenuOpen: boolean;
  onToggleActions: () => void;
  onImageBedConfig: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  pendingTransfers: number;
  // library switch
  libraryMode: 'personal' | 'shared';
  setLibraryMode: React.Dispatch<React.SetStateAction<'personal' | 'shared'>>;
  // right panel
  handleTabSwitch: (tab: 'view' | 'create' | 'shared') => void;
  togglePlacingType: (type: 'agent' | 'skill') => void;
  handleOpenEditor: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredLineups: BaseLineup[];
  selectedLineupIdRight: string | null;
  handleViewLineup: (id: string) => void;
  handleShare: (id: string, e?: any) => void;
  handleRequestDelete: (id: string, e?: any) => void;
  handleClearAll: () => void;
  userId: string | null;
  userMode: 'login' | 'guest';
  customUserIdInput: string;
  setCustomUserIdInput: (v: string) => void;
  handleApplyCustomUserId: () => void;
  handleResetUserId: () => void;
};

const MainView: React.FC<Props> = ({
  activeTab,
  selectedMap,
  setIsMapModalOpen,
  selectedSide,
  setSelectedSide,
  selectedAgent,
  setSelectedAgent,
  agents,
  agentCounts,
  selectedAbilityIndex,
  setSelectedAbilityIndex,
  setIsPreviewModalOpen,
  getMapDisplayName,
  openChangelog,
  mapIcon,
  mapCover,
  lineups,
  selectedLineupId,
  onLineupSelect,
  newLineupData,
  setNewLineupData,
  placingType,
  setPlacingType,
  onViewLineup,
  isFlipped,
  sharedLineup,
  isActionMenuOpen,
  onToggleActions,
  onImageBedConfig,
  onChangePassword,
  onClearLineups,
  pendingTransfers,
  libraryMode,
  setLibraryMode,
  handleTabSwitch,
  togglePlacingType,
  handleOpenEditor,
  searchQuery,
  setSearchQuery,
  filteredLineups,
  selectedLineupIdRight,
  handleViewLineup,
  handleShare,
  handleRequestDelete,
  handleClearAll,
  userId,
  userMode,
  customUserIdInput,
  setCustomUserIdInput,
  handleApplyCustomUserId,
  handleResetUserId,
}) => {
  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      <LeftPanel
        activeTab={activeTab}
        selectedMap={selectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        selectedSide={selectedSide}
        setSelectedSide={(val) => setSelectedSide(val as 'all' | 'attack' | 'defense')}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        agents={agents}
        agentCounts={agentCounts}
        selectedAbilityIndex={selectedAbilityIndex}
        setSelectedAbilityIndex={setSelectedAbilityIndex}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        getMapDisplayName={getMapDisplayName}
        openChangelog={openChangelog}
      />

      <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
        <LeafletMap
        mapIcon={mapIcon}
        mapCover={mapCover}
        activeTab={activeTab}
        lineups={lineups}
        selectedLineupId={selectedLineupId}
        onLineupSelect={onLineupSelect}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        placingType={placingType}
        setPlacingType={(val) => setPlacingType(val as 'agent' | 'skill' | null)}
        selectedAgent={selectedAgent}
        selectedAbilityIndex={selectedAbilityIndex}
        onViewLineup={onViewLineup}
        isFlipped={isFlipped}
        sharedLineup={sharedLineup}
        />
        <QuickActions
          isOpen={isActionMenuOpen}
          onToggle={onToggleActions}
          onImageBedConfig={onImageBedConfig}
          onChangePassword={onChangePassword}
          onClearLineups={onClearLineups}
          pendingTransfers={pendingTransfers}
        />
        {activeTab !== 'shared' && (
          <LibrarySwitch
            libraryMode={libraryMode}
            onSwitch={(mode) => {
              setLibraryMode(mode);
              onLineupSelect(null);
            }}
            sharedDisabled={activeTab === 'create'}
            disabledReason="创建模式仅支持个人库"
          />
        )}
      </div>

      <RightPanel
        activeTab={activeTab}
        handleTabSwitch={(tab) => handleTabSwitch(tab as 'view' | 'create' | 'shared')}
        selectedSide={selectedSide}
        setSelectedSide={(val) => setSelectedSide(val as 'all' | 'attack' | 'defense')}
        placingType={placingType}
        togglePlacingType={(type) => togglePlacingType(type as 'agent' | 'skill')}
        newLineupData={newLineupData}
        handleOpenEditor={handleOpenEditor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredLineups={filteredLineups}
        selectedLineupId={selectedLineupIdRight}
        handleViewLineup={handleViewLineup}
        handleShare={handleShare}
        handleRequestDelete={handleRequestDelete}
        handleClearAll={handleClearAll}
        getMapDisplayName={getMapDisplayName}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        userId={userId}
        userMode={userMode}
        customUserIdInput={customUserIdInput}
        setCustomUserIdInput={setCustomUserIdInput}
        handleApplyCustomUserId={handleApplyCustomUserId}
        handleResetUserId={handleResetUserId}
        libraryMode={libraryMode}
      />
    </div>
  );
};

export default MainView;
