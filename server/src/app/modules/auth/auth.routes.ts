import express from "express";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import authMiddleware from "../../middlewares/authMiddleware";
import { AuthControllers } from "./auth.controllers";
import { registerSchema, loginSchema, googleCodeSchema } from "./auth.validator";

const router = express.Router();

router.post("/register", validatorMiddleware(registerSchema), AuthControllers.register);
router.post("/login", validatorMiddleware(loginSchema), AuthControllers.login);
router.post("/google-login", validatorMiddleware(googleCodeSchema), AuthControllers.googleLogin);
router.get("/me", authMiddleware, AuthControllers.getMe);
router.post("/logout", authMiddleware, AuthControllers.logout);

export const AuthRoutes = router;
