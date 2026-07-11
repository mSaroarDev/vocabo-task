import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createTeam as createTeamAction,
  fetchTeams as fetchTeamsAction,
  joinTeam as joinTeamAction,
  addTeamMember as addTeamMemberAction,
  removeTeamMember as removeTeamMemberAction,
  deleteTeam as deleteTeamAction,
  leaveTeam as leaveTeamAction,
  selectTeam as selectTeamAction,
  setTeams as setTeamsAction,
  type Team,
} from "@/store/slices/teamsSlice";

export function useTeams() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth as NonNullable<typeof state.auth>);
  const { items: teams, selectedTeamId, isLoading, lastFetched, error } = useAppSelector(
    (state) => state.teams as NonNullable<typeof state.teams>
  );

  const selectedTeam = useMemo(
    () => teams.find((team: Team) => team.id === selectedTeamId) || teams[0] || null,
    [teams, selectedTeamId]
  );

  const shouldRefetch = useMemo(() => {
    if (!lastFetched) return true;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [lastFetched]);

  useEffect(() => {
    if (token && shouldRefetch && !isLoading) {
      dispatch(fetchTeamsAction());
    }
  }, [dispatch, isLoading, shouldRefetch, token]);

  return {
    teams,
    selectedTeam,
    isLoading,
    error,
    shouldRefetch,
    fetchTeams: () => dispatch(fetchTeamsAction()).unwrap(),
    addTeam: async (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) return null;
      return dispatch(createTeamAction({ name: cleanName })).unwrap();
    },
    joinTeam: async (inviteCode: string) => {
      const cleanCode = inviteCode.trim().toUpperCase();
      if (!cleanCode) return null;
      return dispatch(joinTeamAction({ inviteCode: cleanCode })).unwrap();
    },
    addTeamMember: async (teamId: string, email: string) => {
      const result = await dispatch(addTeamMemberAction({ teamId, email })).unwrap();
      dispatch(fetchTeamsAction());
      return result;
    },
    removeTeamMember: async (teamId: string, memberUserId: string) => {
      const result = await dispatch(removeTeamMemberAction({ teamId, memberUserId })).unwrap();
      dispatch(fetchTeamsAction());
      return result;
    },
    deleteTeam: async (teamId: string) => {
      return dispatch(deleteTeamAction(teamId)).unwrap();
    },
    leaveTeam: async (teamId: string) => {
      return dispatch(leaveTeamAction(teamId)).unwrap();
    },
    setSelectedTeam: (team: Team) => dispatch(selectTeamAction(team.id)),
    setTeams: (newTeams: Team[]) => dispatch(setTeamsAction(newTeams)),
  };
}
