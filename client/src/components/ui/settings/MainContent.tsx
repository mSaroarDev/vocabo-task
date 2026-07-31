import type { User, Team } from "./types";
import ProfileContent from "./ProfileContent";
import WorkspacesContent from "./TeamspacesContent";

interface MainContentProps {
  activeNav: string;
  teams: Team[];
  defaultTeamId: string | null;
  setDefaultTeamId: (id: string | null) => void;
  limitCreation: boolean;
  setLimitCreation: (v: boolean) => void;
  user: User | null;
  onSetDefaultTeam: (team: Team) => void;
  onNewTeamspace: () => void;
  onNestedModalActiveChange: (active: boolean) => void;
  onDeleteTeam: (team: { id: string; name: string }) => Promise<void>;
}

export default function MainContent({
  activeNav,
  teams,
  defaultTeamId,
  setDefaultTeamId,
  limitCreation,
  setLimitCreation,
  user,
  onSetDefaultTeam,
  onNewTeamspace,
  onNestedModalActiveChange,
  onDeleteTeam,
}: MainContentProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#191919] px-12 pt-9">
      {activeNav === "profile" && <ProfileContent user={user} />}
      {activeNav === "workspaces" && (
        <WorkspacesContent
          teams={teams}
          defaultTeamId={defaultTeamId}
          setDefaultTeamId={setDefaultTeamId}
          limitCreation={limitCreation}
          setLimitCreation={setLimitCreation}
          onSetDefaultTeam={onSetDefaultTeam}
          onNewTeamspace={onNewTeamspace}
          onNestedModalActiveChange={onNestedModalActiveChange}
          onDeleteTeam={onDeleteTeam}
        />
      )}
      {activeNav !== "profile" && activeNav !== "workspaces" && (
        <div>
          <h1 className="text-[28px] font-bold text-white capitalize">
            {activeNav.replace("-", " ")}
          </h1>
          <p className="mt-1 text-sm text-[#9B9B9B]">
            Manage your settings for this section
          </p>
        </div>
      )}
    </div>
  );
}
