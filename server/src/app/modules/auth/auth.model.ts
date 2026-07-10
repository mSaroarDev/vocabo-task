import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  googleId?: string;
  telegramChatId?: number;
  telegramConnected?: boolean;
  telegramConnectToken?: string | null;
  telegramUsername?: string;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: "",
    },
    telegramChatId: {
      type: Number,
      default: null,
    },
    telegramConnected: {
      type: Boolean,
      default: false,
    },
    telegramConnectToken: {
      type: String,
      default: null,
    },
    telegramUsername: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET || "your_jwt_secret_key",
    { expiresIn: "7d" }
  );
};

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
