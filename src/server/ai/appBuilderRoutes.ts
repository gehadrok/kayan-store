import type { Request, Response, Express } from 'express';
import AdmZip from 'adm-zip';
import { db } from '../db.ts';
import { aiGateway } from './index.ts';
import type { ApplicationSpecification, ArchitecturePlan, PIRProject, PIRValidationResult, AppBuilderArtifacts } from './types.ts';

export function registerAppBuilderRoutes(app: Express, requireUser: any, aiRateLimiter: any) {
  // 1. Generate Specification from Idea
  app.post('/api/ai/app-builder/idea', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const { prompt, name } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Valid application idea description is required.' });
      }

      const projectName = name && typeof name === 'string' ? name.trim() : (prompt.slice(0, 30) + ' App');

      // Generate structured specification via AI Gateway / Gemini
      const spec = await aiGateway.generateSpecification(prompt);

      // Create AI project with specification
      const project = await db.createAIProject(userId, projectName, prompt, 'APP_BUILDER');

      // Update project with specification
      const updated = await db.updateAIProject(project.id, userId, {
        specification: spec,
        status: 'active'
      } as any);

      return res.json({
        success: true,
        project: updated || { ...project, specification: spec }
      });
    } catch (error: any) {
      console.error('App Builder Idea Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate application specification.' });
    }
  });

  // 2. Update Specification
  app.post('/api/ai/app-builder/projects/:id/specification', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const { specification } = req.body;

      if (!specification) {
        return res.status(400).json({ error: 'Specification payload is required.' });
      }

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const updated = await db.updateAIProject(projectId, userId, {
        specification
      } as any);

      return res.json({ success: true, project: updated });
    } catch (error: any) {
      console.error('Update Spec Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update specification.' });
    }
  });

  // 3. Approve Specification & Generate Architecture, PIR, Artifacts
  app.post('/api/ai/app-builder/projects/:id/approve', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const spec = (project as any).specification;
      if (!spec) {
        return res.status(400).json({ error: 'No specification found on project. Generate or provide specification first.' });
      }

      // Generate Architecture Plan
      const architecture = await aiGateway.generateArchitecture(spec);

      // Generate PIR (Project Intermediate Representation)
      const pir = await aiGateway.generatePIR(spec, architecture);

      // Validate PIR
      const validation = await aiGateway.validatePIR(pir);

      // Generate Artifacts (Database Schema SQL, Backend files, Frontend files, API contracts, RBAC matrix)
      const generatedArtifacts = await aiGateway.generateArtifacts(pir);

      // Update project in DB
      const updated = await db.updateAIProject(projectId, userId, {
        architecture,
        pir,
        generatedArtifacts
      } as any);

      return res.json({
        success: true,
        project: updated,
        validation
      });
    } catch (error: any) {
      console.error('App Builder Approve Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to process architecture and code generation pipeline.' });
    }
  });

  // 4. Validate PIR endpoint
  app.post('/api/ai/app-builder/projects/:id/validate-pir', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const { pir } = req.body;

      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const targetPir = pir || (project as any).pir;
      if (!targetPir) {
        return res.status(400).json({ error: 'No PIR provided for validation.' });
      }

      const validation = await aiGateway.validatePIR(targetPir);
      return res.json({ success: true, validation });
    } catch (error: any) {
      console.error('Validate PIR Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to validate PIR.' });
    }
  });

  // 5. Get User App Builder Projects
  app.get('/api/ai/app-builder/projects', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projects = await db.getUserAIProjects(userId);
      const appBuilderProjects = projects.filter(p => (p as any).specification || p.type === 'APP_BUILDER');
      return res.json({ success: true, projects: appBuilderProjects });
    } catch (error: any) {
      console.error('Get Projects Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve projects.' });
    }
  });

  // 6. Get Single Project
  app.get('/api/ai/app-builder/projects/:id', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const project = await db.getAIProjectById(projectId);

      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      return res.json({ success: true, project });
    } catch (error: any) {
      console.error('Get Project Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to retrieve project.' });
    }
  });

  // 7. Download Project Artifacts ZIP
  app.get('/api/ai/app-builder/projects/:id/download-zip', requireUser, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'guest';
      const projectId = req.params.id;
      const project = await db.getAIProjectById(projectId);

      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      const artifacts = (project as any).generatedArtifacts;
      if (!artifacts) {
        return res.status(400).json({ error: 'No generated artifacts available for download.' });
      }

      const zip = new AdmZip();

      // Add database schema SQL
      if (artifacts.databaseSchemaSQL) {
        zip.addFile('database/schema.sql', Buffer.from(artifacts.databaseSchemaSQL, 'utf8'));
      }

      // Add backend files
      if (Array.isArray(artifacts.backendFiles)) {
        for (const file of artifacts.backendFiles) {
          const safePath = String(file.path || '').replace(/^\/+/, '').replace(/\.\.+/g, '');
          if (safePath) {
            zip.addFile(`backend/${safePath}`, Buffer.from(file.content || '', 'utf8'));
          }
        }
      }

      // Add frontend files
      if (Array.isArray(artifacts.frontendFiles)) {
        for (const file of artifacts.frontendFiles) {
          const safePath = String(file.path || '').replace(/^\/+/, '').replace(/\.\.+/g, '');
          if (safePath) {
            zip.addFile(`frontend/${safePath}`, Buffer.from(file.content || '', 'utf8'));
          }
        }
      }

      // Add API contracts JSON
      if (artifacts.apiContracts) {
        zip.addFile('docs/api_contracts.json', Buffer.from(JSON.stringify(artifacts.apiContracts, null, 2), 'utf8'));
      }

      // Add RBAC matrix JSON
      if (artifacts.rbacMatrix) {
        zip.addFile('docs/rbac_matrix.json', Buffer.from(JSON.stringify(artifacts.rbacMatrix, null, 2), 'utf8'));
      }

      const zipBuffer = zip.toBuffer();
      const safeProjectName = (project.name || 'kayan_app').replace(/[^a-zA-Z0-9_-]/g, '_');

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeProjectName}_architecture.zip"`);
      return res.send(zipBuffer);
    } catch (error: any) {
      console.error('Download ZIP Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate ZIP archive.' });
    }
  });
}
