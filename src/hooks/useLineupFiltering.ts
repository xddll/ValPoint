import { useMemo } from 'react';
import { MAP_TRANSLATIONS } from '../constants/maps';
import { BaseLineup, SharedLineup, LineupSide } from '../types/lineup';

type UseLineupFilteringParams = {
  lineups: BaseLineup[];
  sharedLineups: BaseLineup[];
  libraryMode: 'personal' | 'shared';
  selectedMap: { displayName: string } | null;
  selectedAgent: { displayName: string } | null;
  selectedSide: 'all' | LineupSide;
  selectedAbilityIndex: number | null;
  searchQuery: string;
  activeTab: string;
  sharedLineup: SharedLineup | null;
  sharedFilterUserId: string | null;
};

export function useLineupFiltering({
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
  sharedFilterUserId,
}: UseLineupFilteringParams) {
  const mapZhToEn = useMemo<Record<string, string>>(() => {
    const reverse: Record<string, string> = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);

  const agentCounts = useMemo<Record<string, number>>(() => {
    if (!selectedMap) return {};
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    const counts: Record<string, number> = {};
    const source = libraryMode === 'shared' ? sharedLineups : lineups;
    source.forEach((l) => {
      if (l.mapName !== mapKey && l.mapName !== mapKeyEn) return;
      // 角标展示该地图下该特工的总数，不受攻/防筛选影响
      counts[l.agentName] = (counts[l.agentName] || 0) + 1;
    });
    return counts;
  }, [lineups, sharedLineups, selectedMap, selectedSide, libraryMode, mapZhToEn]);

  const filteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    return lineups.filter((l) => {
      const mapMatch = l.mapName === mapKey || l.mapName === mapKeyEn;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
    });
  }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, mapZhToEn]);

  const sharedFilteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    return sharedLineups.filter((l) => {
      const mapMatch = l.mapName === mapKey || l.mapName === mapKeyEn;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      const sharedUserMatch = !sharedFilterUserId || l.userId === sharedFilterUserId;
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch && sharedUserMatch;
    });
  }, [sharedLineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, sharedFilterUserId, mapZhToEn]);

  const isFlipped = activeTab === 'shared' ? sharedLineup?.side === 'defense' : selectedSide === 'defense';

  const mapLineups = useMemo(() => {
    if (activeTab === 'shared' && sharedLineup) return [sharedLineup];
    if (activeTab === 'view' || activeTab === 'create') return libraryMode === 'shared' ? sharedFilteredLineups : filteredLineups;
    return libraryMode === 'shared' ? sharedLineups : lineups;
  }, [activeTab, sharedLineup, filteredLineups, sharedFilteredLineups, lineups, sharedLineups, libraryMode]);

  return { agentCounts, filteredLineups, sharedFilteredLineups, isFlipped, mapLineups };
}
