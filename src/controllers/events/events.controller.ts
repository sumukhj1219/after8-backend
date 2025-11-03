import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware.js";
import { acceptInvitationSchema, createEventSchema, deleteEventSchema, filterEventSchema, rejectInvitationSchema, searchEventSchema, sendtInvitationSchema, updateEventSchema } from "../../validators/events.validators.js";
import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.message, 400);

    const eventData = parsed.data;
    const adminId = req.user?.id;
    if (!adminId) throw new AppError("Admin ID is required", 400);

    const createdEvent = await prisma.event.create({
      data: {
        name: eventData.name,
        maxSeats: eventData.maxSeats,
        scheduled: eventData.scheduled,
        price: eventData.price,
        venue: eventData.venue,
        adminId,
      },
    });

    return sendResponse(res, "Event created successfully", 201, createdEvent);
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = deleteEventSchema.safeParse({ id });

    if (!parsed.success) {
      throw new AppError(parsed.error.message, 400);
    }

    await prisma.event.delete({
      where: { id: parsed.data.id },
    });

    return sendResponse(res, "Event deleted successfully", 200);

  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.message, 400);
    }

    const data = parsed.data;

    const eventId = req.params.id;
    if (!eventId) {
      throw new AppError("Event ID is required", 400);
    }

    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existingEvent) {
      throw new AppError("Event not found", 404);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      // @ts-ignore
      data
    });

    return sendResponse(res, "Event updated successfully", 200, updatedEvent);

  } catch (error) {
    next(error);
  }
}

export async function all(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        scheduled: true,
        registrations: true,
        price: true,
        venue: true,
        maxSeats: true,
      }
    })

    return sendResponse(res, "Events", 200, events)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id
    if (!eventId) {
      throw new AppError("No eventId is found")
    }

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        price: true,
        registrations: true,
        name: true,
        scheduled: true,
        maxSeats: true,
      }
    })

    return sendResponse(res, "Event fetched successfully", 200, event)
  } catch (error) {
    next(error)
  }
}

export async function filter(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = filterEventSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.message, 400);
    }

    const { name, city, price, keywords } = parsed.data;

    const filter: any = {
      AND: [
        name ? { name: { contains: name, mode: "insensitive" } } : {},
        city ? { location: { path: ["city"], equals: city } } : {},
        price ? { price: { equals: price } } : {},
        keywords?.length ? { keywords: { hasSome: keywords } } : {},
      ],
    };

    const events = await prisma.event.findMany({ where: filter });

    res.status(200).json({
      message: "Filtered results retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = searchEventSchema.safeParse(req.query)
    if (!parsed.success) {
      throw new AppError("Name is required", 400)
    }

    const name = parsed.data.name

    const filter: any = {
      AND: [
        name ? { name: { contains: name, mode: "insensitive" } } : {},
      ],
    };

    const events = await prisma.event.findMany({ where: filter });

    return sendResponse(res, "Searched sucessfully", 200, events)
  } catch (error) {
    next(error)
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!eventId) throw new AppError("EventId not found", 404);
    if (!userId) throw new AppError("Unauthorized", 401);

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, userId },
    });

    if (existing) {
      return res.json({ message: "Already registered", status: existing.status });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: "PENDING"
      }
    });

    await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        userId: userId
      }
    })

    return res.json({
      message: "Registration successful",
      data: registration
    });

  } catch (error) {
    next(error);
  }
}

export async function checkRegisteredUser(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id
    const userId = req.user?.id

    if (!userId || !eventId) {
      throw new AppError("Invalid inputs", 400)
    }

    const data = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: userId
      }
    })

    if (data) {
      return sendResponse(res, "Exisits", 200, true)
    }

    return sendResponse(res, "Exisits", 200, false)
  } catch (error) {
    next(error)
  }
}

export async function cancelRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!eventId) throw new AppError("EventId not found", 404);
    if (!userId) throw new AppError("Unauthorized", 401);

    await prisma.eventRegistration.delete({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });


    return sendResponse(res, "Cancelled event sucessfully", 200)

  } catch (error) {
    next(error);
  }
}

export async function sendInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = sendtInvitationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("EventId and ReceiverId required", 400);

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { eventId, recieverId } = parsed.data;

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: recieverId
      }
    });


    if (!registration) throw new AppError("User not registered for event", 404);

    const existingInvite = await prisma.invitation.findFirst({
      where: { eventId, receiverId: recieverId }
    });

    if (existingInvite) throw new AppError("Invitation already sent", 400);

    await prisma.invitation.upsert({
      where: {
        eventId_receiverId: {
          eventId,
          receiverId: recieverId
        }
      },
      update: {
        status: "SENT",
        senderId: userId
      },
      create: {
        status: "SENT",
        senderId: userId,
        receiverId: recieverId,
        eventId
      }
    });


    await prisma.eventRegistration.update({
      where: {
        eventId_userId: {
          eventId,
          userId: recieverId
        }
      },
      data: { status: "PENDING" }
    });

    return sendResponse(res, "Invitation sent successfully", 200)

  } catch (error) {
    next(error);
  }
}

export async function rejectInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = rejectInvitationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("EventId and ReceiverId required", 400);

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { eventId, recieverId } = parsed.data;

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: recieverId
      }
    });

    if (!registration) throw new AppError("User not registered for event", 404);

    await prisma.invitation.update({
      where: {
        eventId_receiverId: {
          eventId,
          receiverId: recieverId
        }
      },
      data: {
        status: "DECLINED"
      }
    });

    await prisma.eventRegistration.update({
      where: {
        eventId_userId: {
          eventId,
          userId: recieverId
        }
      },
      data: { status: "REJECTED" }
    });


    return sendResponse(res, "Invitation sent successfully", 200)

  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = acceptInvitationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("EventId required", 400);

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { eventId } = parsed.data;

    const invite = await prisma.invitation.findFirst({
      where: {
        eventId,
        receiverId: userId,
        status: "SENT"
      }
    });

    if (!invite) throw new AppError("No pending invitation found", 404);

    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" }
    });

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: userId
        }
      }
    });

    if (!registration) throw new AppError("User not registered for event", 404);

    await prisma.eventRegistration.update({
      where: {
        eventId_userId: {
          eventId,
          userId: userId
        }
      },
      data: { status: "APPROVED" }
    });

    res.json({ message: "You're confirmed for the event 🎉" });
  } catch (error) {
    next(error);
  }
}

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? ""
    const { eventId, reviews } = req.body;

    if (!eventId || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: "eventId and reviews array are required",
      });
    }

    const existing = await prisma.review.findFirst({
      where: { eventId, userId }
    });

    if (existing) {
      throw new AppError("You have already submitted the feedback", 400)
    }

    const reviewData = reviews.map((r) => ({
      eventId,
      userId,
      categoryId: r.id,
      rating: r.rating,
      comment: r.message,
    }));

    await prisma.review.createMany({
      data: reviewData,
    });

    return sendResponse(res, "Feedback submitted sucessfully", 200)

  } catch (error) {
    next(error);
  }
}

export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {

    const eventsFeedback = await prisma.event.findMany({
      include:{
        user:{
          select:{
            name:true
          }
        },
        Review:true
      }
    })

    return sendResponse(res, "Events feedback", 200, eventsFeedback)
  } catch (error) {
    next(error)
  }
}

export async function invitedEvents(req: Request, res: Response, next: NextFunction){
  try {
    const invitedEvents = await prisma.invitation.findMany({
      where:{
        receiverId:req.user?.id ?? "",
        status:"SENT"
      },
      include:{
        event:{
          select:{
            name:true,
            scheduled:true,
            maxSeats:true,
            registrations:true,
            venue:true
          }
        }
      }
    })

    if(!invitedEvents){
      throw new AppError("No invitations fo this user", 400)
    }

    return sendResponse(res, "Inviations", 200, invitedEvents)
  } catch (error) {
    next(error)
  }
}


export async function attendedEvents(req: Request, res: Response, next: NextFunction){
  try {
    const invitedEvents = await prisma.invitation.findMany({
      where:{
        receiverId:req.user?.id ?? "",
        status:"ACCEPTED"
      },
      include:{
        event:{
          select:{
            name:true,
            scheduled:true,
            maxSeats:true,
            registrations:true,
            venue:true
          }
        }
      }
    })

    if(!invitedEvents){
      throw new AppError("No invitations fo this user", 400)
    }

    return sendResponse(res, "Inviations", 200, invitedEvents)
  } catch (error) {
    next(error)
  }
}