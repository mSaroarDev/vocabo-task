import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "./team.model";

const createInviteCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const createUniqueInviteCode = async () => {
  let inviteCode = createInviteCode();
  let existingTeam = await TeamModel.exists({ inviteCode });

  while (existingTeam) {
    inviteCode = createInviteCode();
    existingTeam = await TeamModel.exists({ inviteCode });
  }

  return inviteCode;
};

const createTeam = async (userId: string, payload: { name: string }) => {
  const ownerId = new Types.ObjectId(userId);
  const inviteCode = await createUniqueInviteCode();

  const result = await TeamModel.create({
    name: payload.name.trim(),
    inviteCode,
    owner: ownerId,
    members: [
      {
        user: ownerId,
        role: "owner",
        joinedAt: new Date(),
      },
    ],
  });

  return result;
};

const getMyTeams = async (userId: string) => {
  const result = await TeamModel.find({ "members.user": userId }).sort({ createdAt: -1 });
  return result;
};

const joinTeam = async (userId: string, payload: { inviteCode: string }) => {
  const inviteCode = payload.inviteCode.trim().toUpperCase();
  const team = await TeamModel.findOne({ inviteCode });

  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team invite code is invalid");
  }

  const userObjectId = new Types.ObjectId(userId);
  const alreadyMember = team.members.some((member) => member.user.equals(userObjectId));

  if (!alreadyMember) {
    team.members.push({
      user: userObjectId,
      role: "member",
      joinedAt: new Date(),
    });
    await team.save();
  }

  return team;
};

export const TeamServices = {
  createTeam,
  getMyTeams,
  joinTeam,
};
