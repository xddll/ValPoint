import { useEffect, useState } from 'react';
import { CUSTOM_MAP_URLS, MAP_TRANSLATIONS } from '../constants/maps';
import { AgentData, MapOption } from '../types/lineup';

export function useValorantData() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedMap, setSelectedMap] = useState<MapOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    // 获取地图列表（仅保留在 MAP_TRANSLATIONS 或自定义覆盖表里的地图）
    fetch('https://valorant-api.com/v1/maps')
      .then((res) => res.json())
      .then((data: any) => {
        const validMaps = (data?.data || []).filter((m: any) => {
          const name = m?.displayName;
          return MAP_TRANSLATIONS[name] || (CUSTOM_MAP_URLS as Record<string, any>)[name];
        });
        setMaps(validMaps);
        if (validMaps.length > 0) {
          const ascent = validMaps.find((m: any) => m.displayName === 'Ascent');
          setSelectedMap(ascent || validMaps[0]);
        }
      });

    // 获取特工列表（中文），默认选中排序后的第一个
    fetch('https://valorant-api.com/v1/agents?language=zh-CN&isPlayableCharacter=true')
      .then((res) => res.json())
      .then((data: any) => {
        const sorted = (data?.data || []).sort((a: any, b: any) => a.displayName.localeCompare(b.displayName));
        setAgents(sorted);
        if (sorted.length > 0) setSelectedAgent(sorted[0]);
      });
  }, []);

  return {
    maps,
    setMaps,
    agents,
    setAgents,
    selectedMap,
    setSelectedMap,
    selectedAgent,
    setSelectedAgent,
  };
}
