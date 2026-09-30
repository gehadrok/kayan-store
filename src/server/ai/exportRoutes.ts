import type { Request, Response, Express } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { ExportPipeline } from './exportPipeline.ts';
import { getArtifactStorage } from '../storage/index.ts';

export function registerExportRoutes(app: Express, requireUser: any, aiRateLimiter: any) {
  // 1. Get Build Manifest Preview
  app.get('/api/ai/app-builder/projects/:id/export-manifest', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const gate = ExportPipeline.validateExportGate(project);
      if (!gate.passed) {
        return res.status(400).json({
          error: 'EXPORT_GATE_FAILED',
          details: gate.errors
        });
      }

      const { manifest } = await ExportPipeline.packageProject(project);
      return res.json({ success: true, manifest });
    } catch (error: any) {
      console.error('Export Manifest Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate export manifest.' });
    }
  });

  // 2. Create Immutable Project Export
  app.post('/api/ai/app-builder/projects/:id/export', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const gate = ExportPipeline.validateExportGate(project);
      if (!gate.passed) {
        return res.status(400).json({
          error: 'EXPORT_GATE_FAILED',
          details: gate.errors
        });
      }

      const { manifest, zipBuffer } = await ExportPipeline.packageProject(project);
      const manifestChecksum = crypto.createHash('sha256').update(zipBuffer).digest('hex');
      const exportId = 'exp_' + crypto.randomBytes(8).toString('hex');

      // Save export artifact via storage driver
      const storage = getArtifactStorage();
      const stored = await storage.saveProductFile(projectId, `${exportId}.zip`, zipBuffer);

      const exportRecord = {
        exportId,
        projectId,
        userId,
        version: manifest.projectVersion || '1.0.0',
        manifestChecksum,
        storageKey: stored.storedName,
        downloadUrl: stored.downloadUrl,
        createdAt: new Date().toISOString(),
        sizeBytes: zipBuffer.length
      };

      const exports = (project as any).exports || [];
      exports.unshift(exportRecord);
      await db.updateAIProject(projectId, userId, {
        exports
      } as any);

      return res.json({
        success: true,
        export: exportRecord,
        manifest
      });
    } catch (error: any) {
      console.error('Create Export Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate immutable project export.' });
    }
  });

  // 3. List Project Immutable Exports
  app.get('/api/ai/app-builder/projects/:id/exports', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const exports = (project as any).exports || [];
      return res.json({ success: true, exports });
    } catch (error: any) {
      console.error('List Exports Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve project exports.' });
    }
  });

  // 4. Download Secure Export ZIP Package
  app.get('/api/ai/app-builder/projects/:id/export', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const gate = ExportPipeline.validateExportGate(project);
      if (!gate.passed) {
        return res.status(400).json({
          error: 'EXPORT_GATE_FAILED',
          details: gate.errors
        });
      }

      const { manifest, zipBuffer } = await ExportPipeline.packageProject(project);
      const manifestChecksum = crypto.createHash('sha256').update(zipBuffer).digest('hex');

      // Record export record if not present
      let exports = (project as any).exports || [];
      let existingExport = exports.find((e: any) => e.manifestChecksum === manifestChecksum);
      if (!existingExport) {
        const exportId = 'exp_' + crypto.randomBytes(8).toString('hex');
        const storage = getArtifactStorage();
        const stored = await storage.saveProductFile(projectId, `${exportId}.zip`, zipBuffer);
        existingExport = {
          exportId,
          projectId,
          userId,
          version: manifest.projectVersion || '1.0.0',
          manifestChecksum,
          storageKey: stored.storedName,
          downloadUrl: stored.downloadUrl,
          createdAt: new Date().toISOString(),
          sizeBytes: zipBuffer.length
        };
        exports.unshift(existingExport);
        await db.updateAIProject(projectId, userId, { exports } as any);
      }

      const safeProjectName = (project.name || 'kayan_app').replace(/[^a-zA-Z0-9_-]/g, '_');

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeProjectName}_v1.0.0_package.zip"`);
      res.setHeader('X-Export-Id', existingExport.exportId);
      res.setHeader('X-Export-Checksum-SHA256', manifestChecksum);
      return res.send(zipBuffer);
    } catch (error: any) {
      console.error('Export ZIP Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate secure project export package.' });
    }
  });
}
