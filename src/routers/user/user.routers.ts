import express from "express"
import { authorize } from "../../middlewares/authorize.middleware.js"
import { protect } from "../../middlewares/auth.middleware.js"
import { all, create, deleteUser, getUserById, me, updateProfile, updateUser } from "../../controllers/user/user.controller.js"

const router = express.Router()

// authorized routes
router.post("/authorized/create", protect, authorize("ADMIN"), create)
router.patch("/authorized/update/:id", protect, authorize("ADMIN"), updateUser)
router.delete("/authorized/delete/:id", protect, authorize("ADMIN"), deleteUser)
router.get("/authorized/all", protect, authorize("ADMIN"), all)
router.get("/authorized/get/:id", protect, authorize("ADMIN"), getUserById)

// public routes
router.get("/me/:id", protect, me)
router.get("/updateProfile", protect, updateProfile)


export default router