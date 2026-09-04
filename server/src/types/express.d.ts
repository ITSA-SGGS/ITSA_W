import { SafeAdminUser } from './database.js';

declare global {
  namespace Express {
    interface Request {
      user?: SafeAdminUser;
      session?: {
        id: string;
        expires_at: Date | string;
      };
    }
  }
}

export {};
