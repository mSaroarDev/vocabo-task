import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { TeamControllers } from "./team.controllers";
import { createTeamValidator, joinTeamValidator } from "./team.validator";

const router = express.Router();

router.use(authMiddleware);

router.get("/", TeamControllers.getMyTeams);
router.post("/", validatorMiddleware(createTeamValidator), TeamControllers.createTeam);
router.post("/join", validatorMiddleware(joinTeamValidator), TeamControllers.joinTeam);

export const TeamRoutes = router;
