import { z } from "zod";

const createTeamValidator = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters").max(80, "Team name is too long"),
});

const joinTeamValidator = z.object({
  inviteCode: z.string().trim().min(4, "Invite code is required").max(12, "Invite code is too long"),
});

const addMemberValidator = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["project manager", "member", "others"]).optional(),
});

const updateMemberRoleValidator = z.object({
  role: z.enum(["owner", "project manager", "member", "others"]),
});

export { createTeamValidator, joinTeamValidator, addMemberValidator, updateMemberRoleValidator };
