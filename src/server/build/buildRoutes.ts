import type { Request, Response, Express } from 'express';
import { db } from '../db.ts';
import { buildOrchestrator } from './BuildOrchestrator.ts';

const SHA256_HEX_REGEX = /^[a-fA-F0-9]{64}$/;

export function registerBuildRoutes(app: Express, requireUser: any, aiRateLimiter: any) {
  // 1. Submit Build Job
  app.post('/api/ai/app-builder/projects/:id/build', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const { targetPlatform = 'WEB', buildProfile = 'default', exportId, manifestChecksum } = req.body;

      // 1. Validate exportId presence
      if (!exportId || typeof exportId !== 'string' || exportId.trim().length === 0) {
        return res.status(400).json({
          error: 'BUILD_INPUT_INTEGRITY_FAILED',
          message: 'exportId is required and must reference an existing immutable export. Implicit/default export builds are prohibited.'
        });
      }

      // 2. Validate manifestChecksum presence and 64-char SHA-256 hex format
      const cleanChecksum = typeof manifestChecksum === 'string' ? manifestChecksum.trim() : '';
      if (!cleanChecksum || !SHA256_HEX_REGEX.test(cleanChecksum)) {
        return res.status(400).json({
          error: 'BUILD_INPUT_INTEGRITY_FAILED',
          message: 'manifestChecksum is required and must be a valid 64-character SHA-256 hexadecimal string.'
        });
      }

      // 3. Project authentication & ownership check
      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      // 4. Verify that the immutable export exists and belongs to this project
      const projectExports: any[] = (project as any).exports || [];
      const matchingExport = projectExports.find((exp: any) => exp.exportId === exportId.trim());
      if (!matchingExport) {
        return res.status(400).json({
          error: 'BUILD_INPUT_INTEGRITY_FAILED',
          message: `Immutable export with id "${exportId}" was not found for this project. Build cannot start from an implicit or non-existent export.`
        });
      }

      // 5. Verify that manifestChecksum matches the immutable export record
      if (matchingExport.manifestChecksum.toLowerCase() !== cleanChecksum.toLowerCase()) {
        return res.status(400).json({
          error: 'BUILD_INPUT_INTEGRITY_FAILED',
          message: 'Provided manifestChecksum does not match the immutable export checksum.'
        });
      }

      // 6. Validate build eligibility gate
      const gate = buildOrchestrator.validateBuildGate(project);
      if (!gate.passed) {
        return res.status(400).json({
          error: 'BUILD_GATE_FAILED',
          details: gate.errors
        });
      }

      const arch = (project as any).architecture || {};
      const targetStack = {
        frontend: arch.frontend?.framework || 'React',
        backend: arch.backend?.framework || 'Node.js',
        database: arch.database?.engine || 'PostgreSQL'
      };

      // 7. Submit build with verified immutable export details
      const buildJob = await buildOrchestrator.submitBuild({
        userId,
        projectId,
        projectVersion: matchingExport.version || '1.0.0',
        exportId: matchingExport.exportId,
        manifestChecksum: matchingExport.manifestChecksum,
        targetPlatform,
        targetStack,
        buildProfile,
        sourceDownloadUrl: matchingExport.downloadUrl
      }, project, targetPlatform === 'ANDROID' ? 'android_external_builder' : 'github_actions');

      // 8. Save build job in project state
      const builds = (project as any).builds || [];
      builds.unshift(buildJob);
      await db.updateAIProject(projectId, userId, {
        builds
      } as any);

      return res.json({ success: true, buildJob });
    } catch (error: any) {
      console.error('Submit Build Error:', error);
      const isIntegrityFailed = error.message?.includes('BUILD_INPUT_INTEGRITY_FAILED');
      const isUnconfigured = error.message?.includes('EXTERNAL_BUILDER_NOT_CONFIGURED');
      const isSourceUnavailable = error.message?.includes('BUILD_SOURCE_UNAVAILABLE');

      const statusCode = (isIntegrityFailed || isUnconfigured || isSourceUnavailable) ? 400 : 500;
      const errorCode = isIntegrityFailed
        ? 'BUILD_INPUT_INTEGRITY_FAILED'
        : isUnconfigured
        ? 'EXTERNAL_BUILDER_NOT_CONFIGURED'
        : isSourceUnavailable
        ? 'BUILD_SOURCE_UNAVAILABLE'
        : 'BUILD_SUBMISSION_FAILED';

      return res.status(statusCode).json({
        error: errorCode,
        message: error.message || 'Failed to submit build job.'
      });
    }
  });

  // 2. List Project Builds
  app.get('/api/ai/app-builder/projects/:id/builds', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const builds = (project as any).builds || [];
      return res.json({ success: true, builds });
    } catch (error: any) {
      console.error('List Builds Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve builds.' });
    }
  });

  // 3. Get Build Status
  app.get('/api/ai/app-builder/projects/:id/build/:buildId', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const buildId = req.params.buildId;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const builds = (project as any).builds || [];
      const buildJob = builds.find((b: any) => b.buildId === buildId);
      if (!buildJob) {
        return res.status(404).json({ error: 'Build job not found.' });
      }

      const updatedStatus = await buildOrchestrator.getStatus(buildId).catch(() => buildJob);
      return res.json({ success: true, buildJob: updatedStatus });
    } catch (error: any) {
      console.error('Get Build Status Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve build status.' });
    }
  });

  // 4. Cancel Build
  app.post('/api/ai/app-builder/projects/:id/build/:buildId/cancel', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const buildId = req.params.buildId;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const cancelled = await buildOrchestrator.cancel(buildId);
      return res.json({ success: true, cancelled });
    } catch (error: any) {
      console.error('Cancel Build Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to cancel build.' });
    }
  });
}
