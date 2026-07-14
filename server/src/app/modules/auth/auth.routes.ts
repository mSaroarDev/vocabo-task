import express from "express";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import authMiddleware from "../../middlewares/authMiddleware";
import { AuthControllers } from "./auth.controllers";
import { registerSchema, loginSchema, googleCodeSchema, updateProfileSchema } from "./auth.validator";
import { avatarUpload } from "./auth.upload";

const router = express.Router();

router.post("/register", validatorMiddleware(registerSchema), AuthControllers.register);
router.post("/login", validatorMiddleware(loginSchema), AuthControllers.login);
router.post("/google-login", validatorMiddleware(googleCodeSchema), AuthControllers.googleLogin);
router.get("/me", authMiddleware, AuthControllers.getMe);
router.post("/logout", authMiddleware, AuthControllers.logout);
router.patch("/profile", authMiddleware, validatorMiddleware(updateProfileSchema), AuthControllers.updateProfile);
router.post("/avatar", authMiddleware, avatarUpload, AuthControllers.uploadAvatar);
router.delete("/account", authMiddleware, AuthControllers.deleteAccount);
router.post("/telegram/connect-token", authMiddleware, AuthControllers.generateTelegramToken);
router.post("/telegram/disconnect", authMiddleware, AuthControllers.disconnectTelegram);

export const AuthRoutes = router;
