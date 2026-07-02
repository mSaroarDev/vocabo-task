import express from "express";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { SampleControllers } from "./sample.controllers";
import { createSampleValidator, updateSampleValidator } from "./sample.validator";

const router = express.Router();

router.get("/", SampleControllers.getAllSamples);
router.get("/:id", SampleControllers.getSampleById);
router.post("/", validatorMiddleware(createSampleValidator), SampleControllers.createSample);
router.patch("/:id", validatorMiddleware(updateSampleValidator), SampleControllers.updateSample);
router.delete("/:id", SampleControllers.deleteSample);

export const SampleRoutes = router;
