import express from "express"
import { authorize } from "../../middlewares/authorize.middleware.js"
import {  all, create, deleteEvent, filter, getById, register, search, update,  checkRegisteredUser, cancelRegistration, submitReview, getReviews,  attendedEvents } from "../../controllers/events/events.controller.js"
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
router.get("/authorized/getReviews", protect, authorize("ADMIN", "MARKETING"), getReviews)

// public routes
router.get("/all", all)
router.get("/get/:id", getById)
router.get("/filter", filter)
router.get("/search", search)
router.post("/register/:id", protect, register)
router.delete("/cancelRegistration/:id", protect, cancelRegistration)
router.get("/checkRegisteredUser/:id", protect, checkRegisteredUser)
router.post("/submitReview", protect, submitReview)
router.get("/attendedEvents", protect, attendedEvents)


export default router