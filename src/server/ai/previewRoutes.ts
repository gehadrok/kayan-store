import type { Request, Response, Express } from 'express';
import { db } from '../db.ts';
import { PreviewManager } from './previewRuntime.ts';

export function registerPreviewRoutes(app: Express, requireUser: any, aiRateLimiter: any) {
  // 1. Start / Prepare Preview
  app.post('/api/ai/app-builder/projects/:id/preview', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      // Preview Eligibility Gate
      const spec = (project as any).specification;
      const arch = (project as any).architecture;
      const pir = (project as any).pir;
      const artifacts = (project as any).generatedArtifacts;

      if (!spec || !arch || !pir || !artifacts) {
        return res.status(400).json({
          error: 'PREVIEW_GATE_FAILED',
          message: 'Project preview gate failed. Specification, Architecture, PIR, and Generated Artifacts must all exist and be approved.'
        });
      }

      // Prepare static / secure preview artifact
      const previewArtifact = PreviewManager.prepareStaticPreview(projectId, userId, artifacts);

      if (!previewArtifact.securityValidation.passed) {
        return res.status(400).json({
          error: 'PREVIEW_BUILD_FAILED',
          message: 'Security validation failed for generated project artifacts.',
          details: previewArtifact.securityValidation.errors
        });
      }

      // Update project preview state in DB
      const updated = await db.updateAIProject(projectId, userId, {
        previewState: {
          status: previewArtifact.status,
          runtimeAvailable: previewArtifact.runtimeAvailable,
          lastBuiltAt: previewArtifact.createdAt,
          errors: previewArtifact.securityValidation.errors,
          warnings: previewArtifact.securityValidation.warnings
        }
      } as any);

      return res.json({
        success: true,
        preview: previewArtifact,
        project: updated,
        runtimeStatus: PreviewManager.checkRuntimeAvailability()
      });
    } catch (error: any) {
      console.error('Preview Start Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to start preview.' });
    }
  });

  // 2. Get Preview Details & Status
  app.get('/api/ai/app-builder/projects/:id/preview', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const artifacts = (project as any).generatedArtifacts;
      const previewState = (project as any).previewState || { status: 'NOT_READY' };

      let previewArtifact = null;
      if (artifacts) {
        previewArtifact = PreviewManager.prepareStaticPreview(projectId, userId, artifacts);
      }

      return res.json({
        success: true,
        previewState,
        previewArtifact,
        runtimeStatus: PreviewManager.checkRuntimeAvailability()
      });
    } catch (error: any) {
      console.error('Get Preview Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve preview status.' });
    }
  });

  // 3. Stop Preview
  app.post('/api/ai/app-builder/projects/:id/preview/stop', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const updated = await db.updateAIProject(projectId, userId, {
        previewState: {
          status: 'STOPPED',
          runtimeAvailable: PreviewManager.checkRuntimeAvailability().available
        }
      } as any);

      return res.json({ success: true, project });
    } catch (error: any) {
      console.error('Stop Preview Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to stop preview.' });
    }
  });

  // 4. Preview Status check endpoint
  app.get('/api/ai/app-builder/projects/:id/preview/status', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const previewState = (project as any).previewState || { status: 'NOT_READY' };
      return res.json({
        success: true,
        status: previewState.status,
        runtime: PreviewManager.checkRuntimeAvailability()
      });
    } catch (error: any) {
      console.error('Preview Status Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to check preview status.' });
    }
  });
}
