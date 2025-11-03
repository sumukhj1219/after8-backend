import express from "express"
import { protect } from "../../middlewares/auth.middleware.js"
import { getSimilarMatches, save } from "../../controllers/match-maker/match-maker.controller.js"
import { authorize } from "../../middlewares/authorize.middleware.js"

const router = express.Router()

router.post("/save", protect, save)
router.get("/get/:id", protect, authorize("ADMIN", "MARKETING"), getSimilarMatches)

export default router