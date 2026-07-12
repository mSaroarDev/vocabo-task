import crypto from "crypto";
import { User } from "./auth.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { google } from "googleapis";
import { getBotUsername } from "./telegram.bot";

export const AuthServices = {
  register: async (userData: any) => {
    const { email, password, name } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(httpStatus.BAD_REQUEST, "Email already registered");
    }

    const user = await User.create(userData);
    const token = user.generateAuthToken();

    return { user, token };
  },

  login: async (credentials: any) => {
    const { email, password } = credentials;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();
    const { password: _, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, token };
  },

  googleLogin: async (code: string, redirectUri: string) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = await User.create({
        email: data.email,
        name: data.name,
        avatar: data.picture,
        googleId: data.id || "",
        isEmailVerified: true,
      });
    }

    const token = user.generateAuthToken();
    const { password: _, ...userWithoutPassword } = user.toObject();

    return { user: userWithoutPassword, token };
  },

  getMe: async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
  },

  logout: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    user.lastLogin = new Date();
    await user.save();

    return { message: "Logged out successfully" };
  },

  updateProfile: async (userId: string, data: { name?: string; email?: string; phone?: string }) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email already in use");
      }
    }

    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.phone !== undefined) user.phone = data.phone;

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  },

  deleteAccount: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    await User.findByIdAndDelete(userId);
    return { message: "Account deleted successfully" };
  },

  generateTelegramConnectToken: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.telegramConnectToken = token;
    await user.save();

    return { token, botUsername: getBotUsername() };
  },

  disconnectTelegram: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    user.telegramChatId = undefined;
    user.telegramConnected = false;
    user.telegramConnectToken = null;
    user.telegramUsername = undefined;
    await user.save();

    return { message: "Telegram disconnected successfully" };
  },
};