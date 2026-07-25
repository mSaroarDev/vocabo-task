import apiClient from "@/api/client";
import type { PriorityOption } from "@/components/table/types";

export const getPriorityOptions = async (teamId: string, workspaceId: string): Promise<PriorityOption[]> => {
  const res = await apiClient.get(`/teams/${teamId}/workspaces/${workspaceId}/priority-options`);
  return (res.data.data as any[]).map(mapPriorityOption);
};

export const createPriorityOption = async (
  teamId: string,
  workspaceId: string,
  data: { label: string; color: string }
): Promise<PriorityOption> => {
  const res = await apiClient.post(`/teams/${teamId}/workspaces/${workspaceId}/priority-options`, data);
  return mapPriorityOption(res.data.data);
};

export const updatePriorityOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string,
  data: { label?: string; color?: string }
): Promise<PriorityOption> => {
  const res = await apiClient.patch(`/teams/${teamId}/workspaces/${workspaceId}/priority-options/${optionId}`, data);
  return mapPriorityOption(res.data.data);
};

export const deletePriorityOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string
): Promise<void> => {
  await apiClient.delete(`/teams/${teamId}/workspaces/${workspaceId}/priority-options/${optionId}`);
};

export const reorderPriorityOptions = async (
  teamId: string,
  workspaceId: string,
  optionIds: string[]
): Promise<PriorityOption[]> => {
  const res = await apiClient.patch(`/teams/${teamId}/workspaces/${workspaceId}/priority-options/reorder`, { optionIds });
  return (res.data.data as any[]).map(mapPriorityOption);
};

function mapPriorityOption(item: any): PriorityOption {
  return {
    _id: item._id,
    label: item.label,
    color: item.color,
    order: item.order ?? 0,
    workspaceId: item.workspace,
    teamId: item.team,
  };
}
