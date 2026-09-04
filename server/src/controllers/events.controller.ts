import { Request, Response, NextFunction } from 'express';
import { eventsService } from '../services/events.service.js';
import { sendSuccess } from '../utils/response.js';

export class EventsController {
  public async getPublicEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, limit, offset } = req.query as any;
      const events = await eventsService.getPublicEvents({ category, limit, offset });
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  }

  public async getAdminEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, is_published, limit, offset } = req.query as any;
      const events = await eventsService.getAdminEvents({
        category,
        status,
        is_published,
        limit,
        offset,
      });
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  }

  public async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const event = await eventsService.getEventById(id);
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  }

  public async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newEvent = await eventsService.createEvent(req.body);
      sendSuccess(res, newEvent, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await eventsService.updateEvent(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async togglePublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_published } = req.body || {};
      const updated = await eventsService.togglePublish(id, is_published);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async toggleFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_featured } = req.body || {};
      const updated = await eventsService.toggleFeatured(id, is_featured);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await eventsService.deleteEvent(id);
      sendSuccess(res, { message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const eventsController = new EventsController();
