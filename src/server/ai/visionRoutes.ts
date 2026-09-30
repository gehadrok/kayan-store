import type { Request, Response, NextFunction, Express } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { db, artifactStorage } from '../db.ts';
import { aiGateway } from './index.ts';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Configure Multer in-memory storage with strict file type filtering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(mime)) {
      const err = new Error('IMAGE_TYPE_NOT_SUPPORTED');
      return cb(err);
    }
    cb(null, true);
  }
});

// Helper for multer error handling
function handleMulterUpload(fields: multer.Field[] | string) {
  const middleware = Array.isArray(fields)
    ? upload.fields(fields)
    : upload.single(fields);

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'FILE_TOO_LARGE',
            message: 'حجم الصورة يتجاوز الحد المسموح به (10 ميجابايت)'
          });
        }
        if (err.message === 'IMAGE_TYPE_NOT_SUPPORTED') {
          return res.status(400).json({
            success: false,
            error: 'IMAGE_TYPE_NOT_SUPPORTED',
            message: 'نوع الصورة غير مدعوم. الصيغ المدعومة هي: JPG, JPEG, PNG, WEBP'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'FILE_UPLOAD_FAILED',
          message: 'فشل في رفع الصورة'
        });
      }
      next();
    });
  };
}

// Helper to extract uploaded file whether field is 'image' or 'screenshot'
function getUploadedImage(req: Request): Express.Multer.File | null {
  if (req.file) return req.file;
  if (req.files) {
    const files = req.files as Record<string, Express.Multer.File[]>;
    if (files.image && files.image[0]) return files.image[0];
    if (files.screenshot && files.screenshot[0]) return files.screenshot[0];
  }
  return null;
}

// Strict path sanitizer for code files to prevent path traversal
export function sanitizeGeneratedPath(rawPath: string): string {
  let clean = String(rawPath || 'src/components/GeneratedScreen.tsx')
    .replace(/[\0\x00-\x1F]/g, '')
    .replace(/\\/g, '/')
    .replace(/^[a-zA-Z]:\/?/, '')
    .replace(/\/\.+/g, '/')
    .replace(/\.\.+\//g, '')
    .replace(/^\/+/, '');

  if (!clean || clean.startsWith('.')) {
    clean = 'src/components/GeneratedScreen.tsx';
  }
  return clean;
}

// Error normalizer for AI provider responses
function mapAIError(err: any): { status: number; error: string; message: string } {
  const errMsg = (err?.message || '').toLowerCase();

  if (errMsg.includes('missing gemini_api_key') || errMsg.includes('not configured')) {
    return {
      status: 503,
      error: 'AI_PROVIDER_NOT_CONFIGURED',
      message: 'مزود الذكاء الاصطناعي غير مهيأ. يرجى ضبط مفتاح GEMINI_API_KEY.'
    };
  }
  if (errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('429')) {
    return {
      status: 429,
      error: 'AI_RATE_LIMITED',
      message: 'تم تجاوز حدود استخدام مزود الذكاء الاصطناعي. يرجى المحاولة بعد قليل.'
    };
  }
  if (errMsg.includes('503') || errMsg.includes('unavailable') || errMsg.includes('high load')) {
    return {
      status: 503,
      error: 'AI_PROVIDER_UNAVAILABLE',
      message: 'مزود الذكاء الاصطناعي غير متوفر حالياً بسبب الضغط المرتفع. يرجى المحاولة لاحقاً.'
    };
  }
  return {
    status: 500,
    error: 'AI_PROCESSING_ERROR',
    message: err?.message || 'حدث خطأ أثناء معالجة الصورة عبر الذكاء الاصطناعي'
  };
}

export function registerVisionRoutes(app: Express, requireUser: any, aiRateLimiter: any) {
  // =========================================================================
  // 1. POST /api/ai/vision/analyze
  // Detailed image analysis: objects, subjects, style, colors, composition, text
  // =========================================================================
  app.post(
    '/api/ai/vision/analyze',
    requireUser,
    aiRateLimiter,
    handleMulterUpload([
      { name: 'image', maxCount: 1 },
      { name: 'screenshot', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      const startedAt = new Date().toISOString();
      const user = (req as any).user;
      const file = getUploadedImage(req);
      const { projectId, instruction } = req.body;

      if (!file || file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILE_INVALID',
          message: 'لم يتم تقديم أي صورة أو الصورة فارغة'
        });
      }

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'PROJECT_REQUIRED',
          message: 'معرف المشروع (projectId) مطلوب'
        });
      }

      // Verify project ownership
      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'AI_UNAUTHORIZED',
          message: 'غير مصرح لك بالوصول إلى هذا المشروع'
        });
      }

      // Create Job in AIJobQueue
      const { model, routingMode, providerPreference, freeOnly } = req.body;
      const job = aiGateway.jobQueue.createJob({
        userId: user.id,
        projectId,
        type: 'vision_analysis',
        provider: providerPreference || 'auto',
        model: model || 'auto',
        prompt: instruction || 'Analyze image',
        params: {
          originalName: file.originalname,
          sizeBytes: file.size,
          mimeType: file.mimetype
        }
      });
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');

      try {
        // Save image to artifact storage
        const savedMedia = await artifactStorage.saveMediaFile(projectId, file.originalname, file.buffer);

        // Call AIGateway with routing
        const result = await aiGateway.analyzeVision({
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          instruction,
          model
        }, {
          userId: user.id,
          projectId,
          preferredModel: model,
          providerPreference,
          routingMode,
          freeOnly
        });

        const completedAt = new Date().toISOString();

        // Update Job Status
        aiGateway.jobQueue.updateJobStatus(job.id, 'completed', {
          ...result,
          model: result.model,
          providerId: result.providerId
        });

        // Record AI Usage
        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: result.providerId || 'unknown',
          model: result.model || 'auto',
          capability: 'vision_analysis',
          status: 'completed',
          startedAt,
          completedAt,
          metadata: {
            fileName: file.originalname,
            sizeBytes: file.size
          }
        });

        // Save AI Asset
        const asset = await db.createAIAsset({
          projectId,
          userId: user.id,
          jobId: job.id,
          assetType: 'image',
          url: savedMedia.downloadUrl,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          sha256: savedMedia.sha256,
          metadata: {
            originalName: file.originalname,
            analysisSummary: result.description.slice(0, 200)
          }
        });

        return res.json({
          success: true,
          jobId: job.id,
          result,
          asset
        });
      } catch (err: any) {
        const completedAt = new Date().toISOString();
        const mapped = mapAIError(err);

        aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, mapped.error);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'auto',
          model: model || 'auto',
          capability: 'vision_analysis',
          status: 'failed',
          startedAt,
          completedAt,
          metadata: { error: mapped.error }
        });

        return res.status(mapped.status).json({
          success: false,
          jobId: job.id,
          error: mapped.error,
          message: mapped.message
        });
      }
    }
  );

  // =========================================================================
  // 2. POST /api/ai/vision/to-prompt
  // Reverse-engineers an image into a generative prompt specification
  // =========================================================================
  app.post(
    '/api/ai/vision/to-prompt',
    requireUser,
    aiRateLimiter,
    handleMulterUpload([
      { name: 'image', maxCount: 1 },
      { name: 'screenshot', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      const startedAt = new Date().toISOString();
      const user = (req as any).user;
      const file = getUploadedImage(req);
      const { projectId, instruction } = req.body;

      if (!file || file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILE_INVALID',
          message: 'لم يتم تقديم أي صورة أو الصورة فارغة'
        });
      }

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'PROJECT_REQUIRED',
          message: 'معرف المشروع (projectId) مطلوب'
        });
      }

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'AI_UNAUTHORIZED',
          message: 'غير مصرح لك بالوصول إلى هذا المشروع'
        });
      }

      const job = aiGateway.jobQueue.createJob({
        userId: user.id,
        projectId,
        type: 'image_to_prompt',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        prompt: instruction || 'Convert image to prompt',
        params: {
          originalName: file.originalname,
          sizeBytes: file.size,
          mimeType: file.mimetype
        }
      });
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');

      try {
        const savedMedia = await artifactStorage.saveMediaFile(projectId, file.originalname, file.buffer);

        const result = await aiGateway.imageToPrompt({
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          instruction,
          model: 'gemini-3.8-flash'
        });

        const completedAt = new Date().toISOString();
        aiGateway.jobQueue.updateJobStatus(job.id, 'completed', result);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: result.model || 'gemini-3.8-flash',
          capability: 'image_to_prompt',
          status: 'completed',
          startedAt,
          completedAt,
          metadata: { fileName: file.originalname }
        });

        const asset = await db.createAIAsset({
          projectId,
          userId: user.id,
          jobId: job.id,
          assetType: 'image',
          url: savedMedia.downloadUrl,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          sha256: savedMedia.sha256,
          metadata: {
            originalName: file.originalname,
            generatedPrompt: result.prompt.slice(0, 200)
          }
        });

        return res.json({
          success: true,
          jobId: job.id,
          result,
          asset
        });
      } catch (err: any) {
        const completedAt = new Date().toISOString();
        const mapped = mapAIError(err);

        aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, mapped.error);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: 'gemini-3.8-flash',
          capability: 'image_to_prompt',
          status: 'failed',
          startedAt,
          completedAt,
          metadata: { error: mapped.error }
        });

        return res.status(mapped.status).json({
          success: false,
          jobId: job.id,
          error: mapped.error,
          message: mapped.message
        });
      }
    }
  );

  // =========================================================================
  // 3. POST /api/ai/vision/analyze-ui
  // Extracts structured UI specification from screenshot
  // =========================================================================
  app.post(
    '/api/ai/vision/analyze-ui',
    requireUser,
    aiRateLimiter,
    handleMulterUpload([
      { name: 'screenshot', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      const startedAt = new Date().toISOString();
      const user = (req as any).user;
      const file = getUploadedImage(req);
      const { projectId, instruction } = req.body;

      if (!file || file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILE_INVALID',
          message: 'لم يتم تقديم أي لقطة شاشة أو الصورة فارغة'
        });
      }

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'PROJECT_REQUIRED',
          message: 'معرف المشروع (projectId) مطلوب'
        });
      }

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'AI_UNAUTHORIZED',
          message: 'غير مصرح لك بالوصول إلى هذا المشروع'
        });
      }

      const job = aiGateway.jobQueue.createJob({
        userId: user.id,
        projectId,
        type: 'ui_analysis',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        prompt: instruction || 'Analyze UI screenshot',
        params: {
          originalName: file.originalname,
          sizeBytes: file.size,
          mimeType: file.mimetype
        }
      });
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');

      try {
        const savedMedia = await artifactStorage.saveMediaFile(projectId, file.originalname, file.buffer);

        const result = await aiGateway.analyzeUI({
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          instruction,
          model: 'gemini-3.8-flash'
        });

        const completedAt = new Date().toISOString();
        aiGateway.jobQueue.updateJobStatus(job.id, 'completed', result);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: result.model || 'gemini-3.8-flash',
          capability: 'ui_analysis',
          status: 'completed',
          startedAt,
          completedAt,
          metadata: { fileName: file.originalname }
        });

        const asset = await db.createAIAsset({
          projectId,
          userId: user.id,
          jobId: job.id,
          assetType: 'image',
          url: savedMedia.downloadUrl,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          sha256: savedMedia.sha256,
          metadata: {
            originalName: file.originalname,
            pageType: result.pageType
          }
        });

        return res.json({
          success: true,
          jobId: job.id,
          result,
          asset
        });
      } catch (err: any) {
        const completedAt = new Date().toISOString();
        const mapped = mapAIError(err);

        aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, mapped.error);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: 'gemini-3.8-flash',
          capability: 'ui_analysis',
          status: 'failed',
          startedAt,
          completedAt,
          metadata: { error: mapped.error }
        });

        return res.status(mapped.status).json({
          success: false,
          jobId: job.id,
          error: mapped.error,
          message: mapped.message
        });
      }
    }
  );

  // =========================================================================
  // 4. POST /api/ai/vision/to-code
  // Converts UI screenshot to React + TypeScript frontend code (DATA ONLY)
  // =========================================================================
  app.post(
    '/api/ai/vision/to-code',
    requireUser,
    aiRateLimiter,
    handleMulterUpload([
      { name: 'screenshot', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      const startedAt = new Date().toISOString();
      const user = (req as any).user;
      const file = getUploadedImage(req);
      const { projectId, framework, language, instruction } = req.body;

      if (!file || file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILE_INVALID',
          message: 'لم يتم تقديم أي لقطة شاشة للواجهة أو الصورة فارغة'
        });
      }

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'PROJECT_REQUIRED',
          message: 'معرف المشروع (projectId) مطلوب'
        });
      }

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'AI_UNAUTHORIZED',
          message: 'غير مصرح لك بالوصول إلى هذا المشروع'
        });
      }

      const targetFramework = framework || 'React';
      const targetLanguage = language || 'TypeScript';

      const job = aiGateway.jobQueue.createJob({
        userId: user.id,
        projectId,
        type: 'screenshot_to_code',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        prompt: instruction || `Convert UI screenshot to ${targetFramework} code`,
        params: {
          originalName: file.originalname,
          sizeBytes: file.size,
          framework: targetFramework,
          language: targetLanguage
        }
      });
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');

      try {
        const savedMedia = await artifactStorage.saveMediaFile(projectId, file.originalname, file.buffer);

        const rawResult = await aiGateway.screenshotToCode({
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          framework: targetFramework,
          language: targetLanguage,
          instruction,
          model: 'gemini-3.8-flash'
        });

        // Strict path sanitization on all output files
        const sanitizedFiles = rawResult.files.map(f => ({
          path: sanitizeGeneratedPath(f.path),
          content: String(f.content || '')
        }));

        const result = {
          summary: rawResult.summary,
          framework: rawResult.framework || targetFramework,
          language: rawResult.language || targetLanguage,
          files: sanitizedFiles,
          warnings: rawResult.warnings || []
        };

        const completedAt = new Date().toISOString();
        aiGateway.jobQueue.updateJobStatus(job.id, 'completed', result);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: rawResult.model || 'gemini-3.8-flash',
          capability: 'screenshot_to_code',
          status: 'completed',
          startedAt,
          completedAt,
          metadata: {
            fileName: file.originalname,
            filesCount: sanitizedFiles.length
          }
        });

        const asset = await db.createAIAsset({
          projectId,
          userId: user.id,
          jobId: job.id,
          assetType: 'code',
          url: savedMedia.downloadUrl,
          mimeType: 'application/json',
          sizeBytes: Buffer.byteLength(JSON.stringify(sanitizedFiles)),
          metadata: {
            framework: result.framework,
            language: result.language,
            fileCount: sanitizedFiles.length
          }
        });

        return res.json({
          success: true,
          jobId: job.id,
          result,
          asset
        });
      } catch (err: any) {
        const completedAt = new Date().toISOString();
        const mapped = mapAIError(err);

        aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, mapped.error);

        await db.recordAIUsage({
          userId: user.id,
          projectId,
          jobId: job.id,
          provider: 'gemini',
          model: 'gemini-3.8-flash',
          capability: 'screenshot_to_code',
          status: 'failed',
          startedAt,
          completedAt,
          metadata: { error: mapped.error }
        });

        return res.status(mapped.status).json({
          success: false,
          jobId: job.id,
          error: mapped.error,
          message: mapped.message
        });
      }
    }
  );
}
