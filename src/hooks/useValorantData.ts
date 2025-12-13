import { useEffect, useState } from 'react';
import { AgentData, MapOption } from '../types/lineup';
import { localAgents } from '../data/localAgents';
import { localMaps } from '../data/localMaps';

export function useValorantData() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedMap, setSelectedMap] = useState<MapOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    const sortedAgents = [...localAgents].sort((a, b) => a.displayName.localeCompare(b.displayName));
    setAgents(sortedAgents);
    if (sortedAgents.length > 0) setSelectedAgent(sortedAgents[0]);

    const sortedMaps = [...localMaps].sort((a, b) => a.displayName.localeCompare(b.displayName));
    setMaps(sortedMaps);
    if (sortedMaps.length > 0) {
      const ascent = sortedMaps.find((m) => m.displayName === 'Ascent');
      setSelectedMap(ascent || sortedMaps[0]);
    }
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
