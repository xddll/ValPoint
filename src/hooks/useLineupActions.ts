import { saveLineupApi, updateLineupApi, deleteLineupApi, clearLineupsApi } from '../services/lineups';
import { LineupDbPayload } from '../types/lineup';

export const useLineupActions = () => {
  const saveNewLineup = async (payload: LineupDbPayload) => {
    await saveLineupApi(payload);
  };

  const updateLineup = async (id: string, payload: Partial<LineupDbPayload>) => {
    await updateLineupApi(id, payload);
  };

  const deleteLineup = async (id: string) => {
    await deleteLineupApi(id);
  };

  const clearLineups = async (userId: string) => {
    await clearLineupsApi(userId);
  };

  return { saveNewLineup, updateLineup, deleteLineup, clearLineups };
};
