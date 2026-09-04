import { Request, Response, NextFunction } from 'express';
import { adminUsersService } from '../services/adminUsers.service.js';
import { sendSuccess } from '../utils/response.js';

export class AdminUsersController {
  public async listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminUsersService.listUsers();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const user = await adminUsersService.getUserById(id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  public async inviteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newUser = await adminUsersService.inviteUser(req.body);
      sendSuccess(res, newUser, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const updated = await adminUsersService.updateUser(id, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_active } = req.body || {};
      const updated = await adminUsersService.toggleActive(id, is_active);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await adminUsersService.deleteUser(id);
      sendSuccess(res, { message: 'Administrator revoked and deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const adminUsersController = new AdminUsersController();
