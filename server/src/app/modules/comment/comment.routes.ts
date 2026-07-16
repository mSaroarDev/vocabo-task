import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { CommentControllers } from "./comment.controllers";
import { createCommentValidator } from "./comment.validation";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", CommentControllers.getComments);
router.post(
  "/",
  validatorMiddleware(createCommentValidator),
  CommentControllers.createComment
);
router.delete("/:commentId", CommentControllers.deleteComment);

export const CommentRoutes = router;
