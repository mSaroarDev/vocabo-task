import apiClient from "@/api/client";
import type { StatusOption } from "@/components/table/types";

export const getStatusOptions = async (teamId: string, workspaceId: string): Promise<StatusOption[]> => {
  const res = await apiClient.get(`/teams/${teamId}/workspaces/${workspaceId}/status-options`);
  return (res.data.data as any[]).map(mapStatusOption);
};

export const createStatusOption = async (
  teamId: string,
  workspaceId: string,
  data: { label: string; color: string }
): Promise<StatusOption> => {
  const res = await apiClient.post(`/teams/${teamId}/workspaces/${workspaceId}/status-options`, data);
  return mapStatusOption(res.data.data);
};

export const updateStatusOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string,
  data: { label?: string; color?: string }
): Promise<StatusOption> => {
  const res = await apiClient.patch(`/teams/${teamId}/workspaces/${workspaceId}/status-options/${optionId}`, data);
  return mapStatusOption(res.data.data);
};

export const deleteStatusOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string
): Promise<void> => {
  await apiClient.delete(`/teams/${teamId}/workspaces/${workspaceId}/status-options/${optionId}`);
};

export const reorderStatusOptions = async (
  teamId: string,
  workspaceId: string,
  optionIds: string[]
): Promise<StatusOption[]> => {
  const res = await apiClient.patch(`/teams/${teamId}/workspaces/${workspaceId}/status-options/reorder`, { optionIds });
  return (res.data.data as any[]).map(mapStatusOption);
};

function mapStatusOption(item: any): StatusOption {
  return {
    _id: item._id,
    label: item.label,
    color: item.color,
    order: item.order ?? 0,
    workspaceId: item.workspace,
    teamId: item.team,
  };
}
