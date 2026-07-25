import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { StatusOptionControllers } from "./statusOption.controllers";
import { createStatusOptionValidator, updateStatusOptionValidator, reorderStatusOptionsValidator } from "./statusOption.validation";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", StatusOptionControllers.getStatusOptions);
router.post("/", validatorMiddleware(createStatusOptionValidator), StatusOptionControllers.createStatusOption);
router.patch("/reorder", validatorMiddleware(reorderStatusOptionsValidator), StatusOptionControllers.reorderStatusOptions);
router.patch("/:optionId", validatorMiddleware(updateStatusOptionValidator), StatusOptionControllers.updateStatusOption);
router.delete("/:optionId", StatusOptionControllers.deleteStatusOption);

export const StatusOptionRoutes = router;
