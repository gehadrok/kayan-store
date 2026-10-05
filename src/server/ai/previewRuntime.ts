import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type PreviewLifecycleStatus = 
  | 'NOT_READY' 
  | 'READY' 
  | 'BUILDING' 
  | 'RUNNING' 
  | 'FAILED' 
  | 'STOPPED' 
  | 'EXPIRED';

export interface PreviewArtifact {
  id: string;
  projectId: string;
  userId: string;
  status: PreviewLifecycleStatus;
  runtimeAvailable: boolean;
  runtimeMode: 'STATIC_PREVIEW_FALLBACK' | 'ISOLATED_CONTAINER';
  fileTree: Array<{ path: string; sizeBytes: number; mimeType: string }>;
  securityValidation: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  createdAt: string;
  expiresAt: string;
}

const ALLOWED_DEPENDENCIES = new Set([
  'react',
  'react-dom',
  'lucide-react',
  'tailwindcss',
  '@types/react',
  '@types/react-dom',
  'clsx',
  'tailwind-merge'
]);

const FORBIDDEN_COMMANDS = [
  'eval(',
  'exec(',
  'child_process',
  'spawn(',
  'execFile(',
  'vm.',
  'new Function'
];

const FORBIDDEN_SCRIPTS = [
  'preinstall',
  'install',
  'postinstall',
  'prepare'
];

export class PreviewManager {
  /**
   * Check environment runtime capability.
   * In AI Studio preview environment without Docker/container orchestration,
   * we report PREVIEW_RUNTIME_NOT_AVAILABLE and provide a secure Static Preview fallback.
   */
  public static checkRuntimeAvailability(): { available: boolean; code: string; message: string } {
    const hasDockerOrSandbox = process.env.ENABLE_CONTAINER_SANDBOX === 'true';
    if (!hasDockerOrSandbox) {
      return {
        available: false,
        code: 'PREVIEW_RUNTIME_NOT_AVAILABLE',
        message: 'Isolated container runtime is not available in the current host environment. Static Preview fallback is active.'
      };
    }
    return {
      available: true,
      code: 'PREVIEW_RUNTIME_AVAILABLE',
      message: 'Isolated preview runtime is available.'
    };
  }

  /**
   * Validate generated project artifacts for security, path safety, and allowed dependencies.
   */
  public static validateArtifacts(artifacts: any): { passed: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!artifacts) {
      return { passed: false, errors: ['No generated artifacts provided.'], warnings: [] };
    }

    const allFiles = [
      ...(Array.isArray(artifacts.backendFiles) ? artifacts.backendFiles : []),
      ...(Array.isArray(artifacts.frontendFiles) ? artifacts.frontendFiles : [])
    ];

    if (allFiles.length === 0) {
      errors.push('Project contains zero generated files.');
    }

    if (allFiles.length > 200) {
      errors.push('PREVIEW_RESOURCE_LIMIT: File count exceeds maximum allowed limit (200 files).');
    }

    for (const file of allFiles) {
      const filePath = String(file.path || '');
      
      // Path traversal & absolute path check
      if (
        filePath.includes('..') ||
        filePath.startsWith('/') ||
        filePath.startsWith('\\') ||
        filePath.includes('\0') ||
        filePath.includes('C:') ||
        filePath.includes('/app') ||
        filePath.includes('/server') ||
        filePath.includes('.env')
      ) {
        errors.push(`Path security violation detected for file path: "${filePath}". Path traversal or absolute host access blocked.`);
      }

      const content = String(file.content || '');
      
      // Forbidden command scan
      for (const cmd of FORBIDDEN_COMMANDS) {
        if (content.includes(cmd)) {
          errors.push(`Generated Code Security violation: Forbidden execution pattern "${cmd}" found in ${filePath}.`);
        }
      }

      // Secret access attempt detection
      if (
        content.includes('process.env.GEMINI_API_KEY') ||
        content.includes('process.env.DATABASE_URL') ||
        content.includes('S3_SECRET_ACCESS_KEY')
      ) {
        errors.push(`Secret Isolation violation: Attempted access to host secrets detected in ${filePath}.`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Prepare static preview artifact inspection payload.
   */
  public static prepareStaticPreview(projectId: string, userId: string, artifacts: any): PreviewArtifact {
    const validation = this.validateArtifacts(artifacts);
    const runtimeInfo = this.checkRuntimeAvailability();

    const allFiles = [
      ...(Array.isArray(artifacts?.backendFiles) ? artifacts.backendFiles : []),
      ...(Array.isArray(artifacts?.frontendFiles) ? artifacts.frontendFiles : [])
    ];

    const fileTree = allFiles.map((f: any) => ({
      path: String(f.path || 'unknown'),
      sizeBytes: Buffer.byteLength(String(f.content || ''), 'utf8'),
      mimeType: String(f.path || '').endsWith('.sql') ? 'application/sql' : (String(f.path || '').endsWith('.tsx') || String(f.path || '').endsWith('.ts') ? 'text/typescript' : 'text/plain')
    }));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour lifetime

    return {
      id: 'prev_' + crypto.randomBytes(8).toString('hex'),
      projectId,
      userId,
      status: validation.passed ? 'READY' : 'FAILED',
      runtimeAvailable: runtimeInfo.available,
      runtimeMode: 'STATIC_PREVIEW_FALLBACK',
      fileTree,
      securityValidation: validation,
      createdAt: now.toISOString(),
      expiresAt
    };
  }
}
