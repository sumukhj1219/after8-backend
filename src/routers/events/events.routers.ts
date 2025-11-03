import express from "express"
import { authorize } from "../../middlewares/authorize.middleware.js"
import { sendInvitation, all, create, deleteEvent, filter, getById, register, search, update, rejectInvitation, acceptInvitation, checkRegisteredUser, cancelRegistration, submitReview } from "../../controllers/events/events.controller.js"
import { protect } from "../../middlewares/auth.middleware.js"

const router = express.Router()

// authorized routes
router.post("/authorized/create", protect, authorize("ADMIN"), create)
router.delete("/authorized/delete/:id", protect, authorize("ADMIN", "MARKETING"), deleteEvent)
router.patch("/authorized/update/:id", protect, authorize("ADMIN", "MARKETING"), update)
router.get("/authorized/all", protect, authorize("ADMIN", "MARKETING"), all)
router.get("/authorized/get/:id", protect, authorize("ADMIN", "MARKETING"), getById)
router.get("/authorized/filter", protect, authorize("ADMIN", "MARKETING"), filter)
router.get("/authorized/search", protect, authorize("ADMIN", "MARKETING"), search)
router.post("/authorized/send", protect ,authorize("ADMIN", "MARKETING"), sendInvitation)
router.post("/authorized/reject", protect ,authorize("ADMIN", "MARKETING"), rejectInvitation)

// public routes
router.get("/all", all)
router.get("/get/:id", getById)
router.get("/filter", filter)
router.get("/search", search)
router.post("/register/:id", protect, register)
router.delete("/cancelEvent/:id", protect, cancelRegistration)
router.get("/checkRegisteredUser/:id", protect, checkRegisteredUser)
router.post("/accept", protect, acceptInvitation)
router.post("/submitReview", protect, submitReview)

export default router