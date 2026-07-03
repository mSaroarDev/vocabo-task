import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { ColumnControllers } from "./column.controllers";
import { replaceColumnsValidator } from "./column.validator";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", ColumnControllers.getColumns);
router.patch("/", validatorMiddleware(replaceColumnsValidator), ColumnControllers.replaceColumns);

export const ColumnRoutes = router;
