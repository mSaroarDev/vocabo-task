import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { PriorityOptionControllers } from "./priorityOption.controllers";
import { createPriorityOptionValidator, updatePriorityOptionValidator, reorderPriorityOptionsValidator } from "./priorityOption.validation";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", PriorityOptionControllers.getPriorityOptions);
router.post("/", validatorMiddleware(createPriorityOptionValidator), PriorityOptionControllers.createPriorityOption);
router.patch("/reorder", validatorMiddleware(reorderPriorityOptionsValidator), PriorityOptionControllers.reorderPriorityOptions);
router.patch("/:optionId", validatorMiddleware(updatePriorityOptionValidator), PriorityOptionControllers.updatePriorityOption);
router.delete("/:optionId", PriorityOptionControllers.deletePriorityOption);

export const PriorityOptionRoutes = router;
