import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { ExerciseController } from "./exercise.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", ExerciseController.create);
router.get("/", ExerciseController.getAll);
router.get("/:id", ExerciseController.getById);
router.put("/:id", ExerciseController.update);
router.delete("/:id", ExerciseController.delete);

export default router;