import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { TeamControllers } from "./team.controllers";
import { createTeamValidator, joinTeamValidator, addMemberValidator } from "./team.validator";

const router = express.Router();

router.use(authMiddleware);

router.get("/", TeamControllers.getMyTeams);
router.post("/", validatorMiddleware(createTeamValidator), TeamControllers.createTeam);
router.post("/join", validatorMiddleware(joinTeamValidator), TeamControllers.joinTeam);
router.post("/:teamId/members", validatorMiddleware(addMemberValidator), TeamControllers.addMember);
router.delete("/:teamId/members/:memberUserId", TeamControllers.removeMember);

export const TeamRoutes = router;
