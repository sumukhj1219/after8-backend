import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware.js";
import { createEventSchema, deleteEventSchema, filterEventSchema, searchEventSchema, updateEventSchema } from "../../validators/events.validators.js";
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
        plan: eventData.plan
      },
      select: {
        id: true,
        name: true,
        maxSeats: true,
        scheduled: true,
        price: true,
        venue: true,
        adminId: true,
        plan: true
      }
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
      data,
      select: {
        id: true,
        name: true,
        maxSeats: true,
        scheduled: true,
        price: true,
        venue: true,
        adminId: true,
        plan: true
      }
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
        plan: true
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
        plan: true
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

    const { name, venue, price, keywords } = parsed.data;

    const filter: any = {
      AND: [
        name ? { name: { contains: name, mode: "insensitive" } } : {},
        venue ? { name: { contains: venue, mode: "insensitive" } } : {},
        price ? { price: { equals: price } } : {},
        keywords?.length ? { keywords: { hasSome: keywords } } : {},
      ],
    };

    const events = await prisma.event.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        scheduled: true,
        registrations: true,
        price: true,
        venue: true,
        maxSeats: true,
        plan: true
      }
    });

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

    const event = await prisma.event.findUnique({where:{id: eventId}, select:{plan:true}})
    const user = await prisma.user.findUnique({where:{id: userId}, select:{plan:true}})

    if(event?.plan !== user?.plan){
      throw new AppError("User is not eligible for this event", 400)
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: "PENDING"
      }
    });

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
      select: {
        user: {
          select: {
            name: true
          }
        },
        id:true,
        name: true,
        scheduled: true,
        registrations: true,
        price: true,
        venue: true,
        maxSeats: true,
        plan: true,
        Review: true
      }
    })

    return sendResponse(res, "Events feedback", 200, eventsFeedback)
  } catch (error) {
    next(error)
  }
}


export async function attendedEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const attendedEvents = await prisma.eventRegistration.findMany({
      where: {
        userId: req.user?.id ?? "",
        status: "APPROVED"
      },
      include: {
        event: {
          select: {
            name: true,
            scheduled: true,
            maxSeats: true,
            registrations: true,
            venue: true
          }
        }
      }
    })

    if (!attendedEvents) {
      throw new AppError("User has not attended any events", 400)
    }

    return sendResponse(res, "Events", 200, attendedEvents)
  } catch (error) {
    next(error)
  }
}