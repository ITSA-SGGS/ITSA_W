import { Request, Response, NextFunction } from 'express';
import { positionsService } from '../services/positions.service.js';
import { sendSuccess } from '../utils/response.js';

export class PositionsController {
  public async getPublicPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier } = req.query as any;
      const positions = await positionsService.getPublicPositions({ tier });
      sendSuccess(res, positions);
    } catch (error) {
      next(error);
    }
  }

  public async getAdminPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier, is_active, limit, offset } = req.query as any;
      const positions = await positionsService.getAdminPositions({ tier, is_active, limit, offset });
      sendSuccess(res, positions);
    } catch (error) {
      next(error);
    }
  }

  public async getPositionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const position = await positionsService.getPositionById(id);
      sendSuccess(res, position);
    } catch (error) {
      next(error);
    }
  }

  public async createPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newPosition = await positionsService.createPosition(req.body);
      sendSuccess(res, newPosition, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updatePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await positionsService.updatePosition(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_active } = req.body || {};
      const updated = await positionsService.toggleActive(id, is_active);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deletePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await positionsService.deletePosition(id);
      sendSuccess(res, { message: 'Position deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const positionsController = new PositionsController();
