import { Request, Response, NextFunction } from 'express';
import { archiveService } from '../services/archive.service.js';
import { sendSuccess } from '../utils/response.js';

export class ArchiveController {
  public async getPublicArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, offset } = req.query as any;
      const records = await archiveService.getPublicArchive({ limit, offset });
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }

  public async getAdminArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { is_published, limit, offset } = req.query as any;
      const records = await archiveService.getAdminArchive({ is_published, limit, offset });
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }

  public async getArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const record = await archiveService.getArchiveById(id);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  public async createArchiveRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newRecord = await archiveService.createArchiveRecord(req.body);
      sendSuccess(res, newRecord, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateArchiveRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await archiveService.updateArchiveRecord(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async togglePublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_published } = req.body || {};
      const updated = await archiveService.togglePublish(id, is_published);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteArchiveRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await archiveService.deleteArchiveRecord(id);
      sendSuccess(res, { message: 'Archive record deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const archiveController = new ArchiveController();
