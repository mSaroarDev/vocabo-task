import { User } from "./auth.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { google } from "googleapis";

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

  googleLogin: async (code: string) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
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
};