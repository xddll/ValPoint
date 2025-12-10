import { useCallback, useState } from 'react';
import { fetchSharedList, fetchSharedByShareId } from '../services/shared';
import { BaseLineup, SharedLineup } from '../types/lineup';

export const useSharedLineups = (mapNameZhToEn: Record<string, string>) => {
  const [sharedLineups, setSharedLineups] = useState<BaseLineup[]>([]);

  const fetchSharedLineups = useCallback(async () => {
    const list = await fetchSharedList(mapNameZhToEn);
    setSharedLineups(list);
  }, [mapNameZhToEn]);

  const fetchSharedById = useCallback(
    async (shareId: string): Promise<SharedLineup | null> => {
      const lineup = await fetchSharedByShareId(shareId, mapNameZhToEn);
      return lineup;
    },
    [mapNameZhToEn],
  );

  return { sharedLineups, setSharedLineups, fetchSharedLineups, fetchSharedById };
};
