import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service.js';
import { sendSuccess } from '../utils/response.js';

export class TeamController {
  public async getPublicTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier } = req.query as any;
      const team = await teamService.getPublicTeam({ tier });
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  public async getAdminTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier, is_active, limit, offset } = req.query as any;
      const team = await teamService.getAdminTeam({ tier, is_active, limit, offset });
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  public async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const member = await teamService.getMemberById(id);
      sendSuccess(res, member);
    } catch (error) {
      next(error);
    }
  }

  public async createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newMember = await teamService.createMember(req.body);
      sendSuccess(res, newMember, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await teamService.updateMember(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_active } = req.body || {};
      const updated = await teamService.toggleActive(id, is_active);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await teamService.deleteMember(id);
      sendSuccess(res, { message: 'Committee member deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();
