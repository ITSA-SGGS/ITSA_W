import { Request, Response, NextFunction } from 'express';
import { announcementsService } from '../services/announcements.service.js';
import { sendSuccess } from '../utils/response.js';

export class AnnouncementsController {
  public async getActiveAnnouncements(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const announcements = await announcementsService.getActiveAnnouncements();
      sendSuccess(res, announcements);
    } catch (error) {
      next(error);
    }
  }

  public async getAdminAnnouncements(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { is_published, limit, offset } = req.query as any;
      const announcements = await announcementsService.getAdminAnnouncements({
        is_published,
        limit,
        offset,
      });
      sendSuccess(res, announcements);
    } catch (error) {
      next(error);
    }
  }

  public async getAnnouncementById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const announcement = await announcementsService.getAnnouncementById(id);
      sendSuccess(res, announcement);
    } catch (error) {
      next(error);
    }
  }

  public async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newAnnouncement = await announcementsService.createAnnouncement(req.body);
      sendSuccess(res, newAnnouncement, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await announcementsService.updateAnnouncement(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async togglePublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_published } = req.body || {};
      const updated = await announcementsService.togglePublish(id, is_published);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await announcementsService.deleteAnnouncement(id);
      sendSuccess(res, { message: 'Announcement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const announcementsController = new AnnouncementsController();
