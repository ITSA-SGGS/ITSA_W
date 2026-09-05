/**
 * ITSA Platform — Media & Storage Controller
 * Phase 4: Storage & Media Migration
 */

import { Request, Response, NextFunction } from 'express';
import { storageService } from '../storage/storage.service.js';
import { toStorageFile } from '../storage/multer.js';
import { normalizeCategory } from '../storage/validation.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';
import { StorageCategory } from '../storage/types.js';

export class MediaController {
  /**
   * Uploads a media file to the designated storage category.
   * Enforces role-based category authorization:
   * - 'event': Accessible by EDITOR, ADMIN, SUPER_ADMIN
   * - 'team': Accessible by ADMIN, SUPER_ADMIN (EDITOR -> 403)
   * - 'archive': Accessible by ADMIN, SUPER_ADMIN (EDITOR -> 403)
   */
  public uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawCategory =
        req.params.category ||
        req.body.category ||
        req.query.category;

      if (!rawCategory) {
        throw new BadRequestError(
          'Storage category is required. Provide category parameter ("team", "event", or "archive").'
        );
      }

      const category = normalizeCategory(rawCategory);
      this.assertCategoryPermission(req, category);

      const file = toStorageFile(req.file);
      const result = await storageService.uploadMedia(file, category);

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Shortcut endpoint for event media uploads.
   * Allowed for EDITOR, ADMIN, SUPER_ADMIN.
   */
  public uploadEventMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = toStorageFile(req.file);
      const result = await storageService.uploadMedia(file, 'event');
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Shortcut endpoint for team portrait photo uploads.
   * Allowed for ADMIN and SUPER_ADMIN only.
   */
  public uploadTeamMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.assertCategoryPermission(req, 'team');
      const file = toStorageFile(req.file);
      const result = await storageService.uploadMedia(file, 'team');
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Shortcut endpoint for visual archive photo uploads.
   * Allowed for ADMIN and SUPER_ADMIN only.
   */
  public uploadArchiveMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.assertCategoryPermission(req, 'archive');
      const file = toStorageFile(req.file);
      const result = await storageService.uploadMedia(file, 'archive');
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a media object by key or URL.
   * Requires ADMIN or SUPER_ADMIN role.
   */
  public deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = req.body.key || req.body.url || req.query.key || req.query.url;

      if (!target || typeof target !== 'string') {
        throw new BadRequestError(
          'Target key or url is required for deletion (e.g. { "key": "team/portraits/..." }).'
        );
      }

      // Security Guard 1: Prohibit traversal sequences ("..", "\", null bytes)
      if (storageService.containsTraversal(target)) {
        throw new BadRequestError(
          'Invalid storage target: Path traversal sequences ("..") are strictly prohibited.'
        );
      }

      // Security Guard 2: If target is explicitly provided as a key, require canonical namespace
      if (req.body.key || req.query.key) {
        const rawKey = (req.body.key || req.query.key) as string;
        if (!storageService.isCanonicalNamespace(rawKey)) {
          throw new BadRequestError(
            'Invalid storage namespace. Key must belong to one of the canonical namespaces: "team/portraits/", "events/covers/", or "archive/photos/".'
          );
        }
      }

      const deleted = await storageService.deleteMedia(target);
      sendSuccess(res, { deleted, target });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Public endpoint to resolve a stored key, relative path, or legacy Supabase URL to a public URL.
   */
  public resolveMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawUrl = (req.query.url as string) || (req.query.key as string);
      if (!rawUrl) {
        throw new BadRequestError('Query parameter "url" or "key" is required.');
      }

      const resolvedUrl = storageService.resolveMediaUrl(rawUrl);
      sendSuccess(res, { original: rawUrl, resolvedUrl });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Public endpoint to retrieve category metadata, supported formats, and file size limits.
   */
  public getStorageConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const configs = storageService.getAllCategoryConfigs();
      sendSuccess(res, {
        provider: storageService.getProviderName(),
        categories: configs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Internal guard to enforce role restrictions per category.
   */
  private assertCategoryPermission(req: Request, category: StorageCategory): void {
    const userRole = req.user?.role;

    if (category === 'team' && userRole === 'EDITOR') {
      throw new ForbiddenError('Editors are not authorized to upload or mutate team member portraits.');
    }

    if (category === 'archive' && userRole === 'EDITOR') {
      throw new ForbiddenError('Editors are not authorized to upload or mutate archive media.');
    }
  }
}

export const mediaController = new MediaController();
