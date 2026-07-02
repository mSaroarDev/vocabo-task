import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addTeam as addTeamAction,
  selectTeam as selectTeamAction,
  setTeams as setTeamsAction,
  type Team,
} from "@/store/slices/teamsSlice";

export function useTeams() {
  const dispatch = useAppDispatch();
  const { items: teams, selectedTeamId, isLoading, lastFetched } = useAppSelector(
    (state) => state.teams
  );

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || teams[0] || null,
    [teams, selectedTeamId]
  );

  const shouldRefetch = useMemo(() => {
    if (!lastFetched) return true;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [lastFetched]);

  return {
    teams,
    selectedTeam,
    isLoading,
    shouldRefetch,
    addTeam: (name: string) => {
      const avatar = name.charAt(0).toUpperCase();
      const colors = [
        "bg-blue-500/20",
        "bg-purple-500/20",
        "bg-pink-500/20",
        "bg-green-500/20",
        "bg-amber-500/20",
      ];
      const newTeam: Team = {
        id: String(Date.now()),
        name,
        avatar,
        color: colors[teams.length % colors.length],
      };
      dispatch(addTeamAction(newTeam));
      return newTeam;
    },
    setSelectedTeam: (team: Team) => dispatch(selectTeamAction(team.id)),
    setTeams: (newTeams: Team[]) => dispatch(setTeamsAction(newTeams)),
  };
}