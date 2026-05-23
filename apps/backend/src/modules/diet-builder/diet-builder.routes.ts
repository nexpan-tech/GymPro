import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { DietBuilderController } from "./diet-builder.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", DietBuilderController.createPlan);
router.get("/", DietBuilderController.getPlans);
router.get("/:id", DietBuilderController.getPlanById);

router.post("/:dietPlanId/meals", DietBuilderController.addMeal);
router.put("/meals/:mealId", DietBuilderController.updateMeal);
router.delete("/meals/:mealId", DietBuilderController.deleteMeal);

export default router;