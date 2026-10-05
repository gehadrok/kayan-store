import type { Request, Response, NextFunction, Express } from 'express';
import { db } from '../db.ts';
import { validateCVInput } from './cvValidation.ts';

export function registerCVRoutes(app: Express, requireUser: (req: Request, res: Response, next: NextFunction) => void) {

  // 1. Get all CVs for the authenticated user
  app.get('/api/cv', requireUser, async (req: Request, res: Response) => {
    console.log('[API] GET /api/cv - user:', (req as any).user?.id);
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }
      const cvs = await db.getUserCVs(user.id);
      res.json({ success: true, cvs });
    } catch (err: any) {
      console.error('Failed to get user CVs:', err);
      res.status(500).json({ success: false, error: 'فشل في تحميل السير الذاتية' });
    }
  });

  // 2. Create a new CV
  app.post('/api/cv', requireUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }

      const validation = validateCVInput(req.body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }

      const cv = await db.createCV(user.id, validation.sanitized);
      res.status(201).json({ success: true, cv });
    } catch (err: any) {
      console.error('Failed to create CV:', err);
      res.status(500).json({ success: false, error: 'فشل في إنشاء السيرة الذاتية' });
    }
  });

  // 3. Get single CV by ID (with ownership check)
  app.get('/api/cv/:id', requireUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }

      const cv = await db.getCVById(id, user.id);
      if (!cv) {
        return res.status(404).json({ success: false, error: 'السيرة الذاتية غير موجودة أو ليس لديك صلاحية الوصول إليها' });
      }

      res.json({ success: true, cv });
    } catch (err: any) {
      console.error('Failed to get CV:', err);
      res.status(500).json({ success: false, error: 'فشل في جلب السيرة الذاتية' });
    }
  });

  // 4. Update / Autosave CV (with schema validation & ownership check)
  app.put('/api/cv/:id', requireUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }

      const existing = await db.getCVById(id, user.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'السيرة الذاتية غير موجودة أو ليس لديك صلاحية التعديل عليها' });
      }

      const validation = validateCVInput({ ...existing, ...req.body });
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }

      const updated = await db.updateCV(id, user.id, validation.sanitized);
      res.json({ success: true, cv: updated, message: 'تم حفظ التغييرات بنجاح' });
    } catch (err: any) {
      console.error('Failed to update CV:', err);
      res.status(500).json({ success: false, error: 'تعذر الحفظ، حدث خطأ في الخادم' });
    }
  });

  // 5. Delete CV (with ownership check)
  app.delete('/api/cv/:id', requireUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }

      const deleted = await db.deleteCV(id, user.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'السيرة الذاتية غير موجودة أو ليس لديك صلاحية الحذف' });
      }

      res.json({ success: true, message: 'تم حذف السيرة الذاتية بنجاح' });
    } catch (err: any) {
      console.error('Failed to delete CV:', err);
      res.status(500).json({ success: false, error: 'فشل في حذف السيرة الذاتية' });
    }
  });

  // 6. Duplicate CV (with ownership check)
  app.post('/api/cv/:id/duplicate', requireUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'غير مصرح' });
      }

      const existing = await db.getCVById(id, user.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'السيرة الذاتية غير موجودة' });
      }

      const duplicatedData = {
        ...existing,
        title: `${existing.title} (نسخة)`,
        isPrimary: false
      };

      const newCv = await db.createCV(user.id, duplicatedData);
      res.status(201).json({ success: true, cv: newCv });
    } catch (err: any) {
      console.error('Failed to duplicate CV:', err);
      res.status(500).json({ success: false, error: 'فشل في نسخ السيرة الذاتية' });
    }
  });
}
