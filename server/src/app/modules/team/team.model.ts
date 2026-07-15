import mongoose, { Schema } from "mongoose";
import { ITeam } from "./team.interface";

const teamMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "project manager", "member", "others"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

teamSchema.index({ "members.user": 1 });

const TeamModel = mongoose.model<ITeam>("Team", teamSchema);

export default TeamModel;
