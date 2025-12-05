import express from "express"
import { protect } from "../../middlewares/auth.middleware.js"
import { authorize } from "../../middlewares/authorize.middleware.js"
import { assignLevel, createNewLevel, updateLevelData } from "../../controllers/game/game.controller.js"

const router = express.Router()

// admin routes
router.post("/newLevel", protect, authorize("ADMIN", "MARKETING"), createNewLevel)
router.get("/updateLevel/:id", protect, authorize("ADMIN", "MARKETING"), updateLevelData)

// public routes
router.get("/assignLevel", protect, assignLevel)

export default router