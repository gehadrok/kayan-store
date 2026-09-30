import crypto from 'crypto';
import AdmZip from 'adm-zip';
import type { AIProject } from '../../types.ts';

export interface BuildManifest {
  projectId: string;
  projectName: string;
  projectVersion: string;
  generatedAt: string;
  sourceSpecificationVersion: string;
  architectureVersion: string;
  pirVersion: string;
  targetStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  files: Array<{
    path: string;
    sizeBytes: number;
    sha256: string;
  }>;
  totals: {
    files: number;
    bytes: number;
  };
  validation: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
}

const FORBIDDEN_SECRETS = [
  'gemini_api_key',
  'google_api_key',
  'database_url',
  's3_access_key_id',
  's3_secret_access_key',
  'kayan_secret',
  'private_key',
  '.env'
];

const FORBIDDEN_SCRIPTS = [
  'preinstall',
  'install',
  'postinstall',
  'prepare'
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TOTAL_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_FILE_COUNT = 5000;

export class ExportPipeline {
  /**
   * Validate export eligibility gate.
   */
  public static validateExportGate(project: AIProject): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    const spec = (project as any).specification;
    const arch = (project as any).architecture;
    const pir = (project as any).pir;
    const artifacts = (project as any).generatedArtifacts;

    if (!spec) errors.push('EXPORT_GATE_FAILED: Missing application specification.');
    if (!arch) errors.push('EXPORT_GATE_FAILED: Missing architecture plan.');
    if (!pir) errors.push('EXPORT_GATE_FAILED: Missing PIR (Project Intermediate Representation).');
    if (!artifacts) errors.push('EXPORT_GATE_FAILED: Missing generated artifacts.');

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate artifact paths and contents (no traversal, no secrets, safe sizes).
   */
  public static validateArtifactsSafety(files: Array<{ path: string; content: string }>): { passed: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenPaths = new Set<string>();
    let totalBytes = 0;

    if (files.length > MAX_FILE_COUNT) {
      errors.push(`EXPORT_SIZE_LIMIT: File count (${files.length}) exceeds maximum limit (${MAX_FILE_COUNT}).`);
    }

    for (const file of files) {
      const rawPath = String(file.path || '');
      const content = String(file.content || '');

      // Path validation
      if (
        rawPath.includes('..') ||
        rawPath.startsWith('/') ||
        rawPath.startsWith('\\') ||
        rawPath.includes('\0') ||
        rawPath.includes('C:') ||
        rawPath.includes('D:')
      ) {
        errors.push(`EXPORT_ARTIFACT_INVALID: Dangerous path traversal or absolute path detected: "${rawPath}".`);
        continue;
      }

      const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
      if (seenPaths.has(normalizedPath)) {
        errors.push(`EXPORT_ARTIFACT_INVALID: Duplicate file path detected: "${normalizedPath}".`);
        continue;
      }
      seenPaths.add(normalizedPath);

      // Forbidden filenames / secret checks
      const lowerPath = normalizedPath.toLowerCase();
      if (lowerPath.includes('.env') || lowerPath.includes('secret') || lowerPath.includes('credential')) {
        errors.push(`EXPORT_SECRET_DETECTED: Forbidden file name or secret reference detected in path: "${normalizedPath}".`);
        continue;
      }

      const sizeBytes = Buffer.byteLength(content, 'utf8');
      if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        errors.push(`EXPORT_SIZE_LIMIT: File "${normalizedPath}" exceeds 25 MB limit (${sizeBytes} bytes).`);
      }
      totalBytes += sizeBytes;

      // Secret scanning in content
      const lowerContent = content.toLowerCase();
      for (const secretToken of FORBIDDEN_SECRETS) {
        if (lowerContent.includes(secretToken)) {
          errors.push(`EXPORT_SECRET_DETECTED: Potential secret token "${secretToken}" found inside content of "${normalizedPath}".`);
          break;
        }
      }

      // Forbidden script scanning in package.json
      if (normalizedPath.endsWith('package.json')) {
        try {
          const pkg = JSON.parse(content);
          if (pkg.scripts && typeof pkg.scripts === 'object') {
            for (const scriptName of Object.keys(pkg.scripts)) {
              if (FORBIDDEN_SCRIPTS.includes(scriptName.toLowerCase())) {
                warnings.push(`EXPORT_UNSAFE_SCRIPT: Forbidden package script "${scriptName}" found in "${normalizedPath}".`);
              }
            }
          }
        } catch {
          warnings.push(`Warning: Could not parse JSON for "${normalizedPath}".`);
        }
      }
    }

    if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
      errors.push(`EXPORT_SIZE_LIMIT: Total export size (${totalBytes} bytes) exceeds maximum 250 MB limit.`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate deterministic BuildManifest and package ZIP.
   */
  public static async packageProject(project: AIProject): Promise<{ manifest: BuildManifest; zipBuffer: Buffer }> {
    const gate = this.validateExportGate(project);
    if (!gate.passed) {
      throw new Error(gate.errors.join('; '));
    }

    const spec = (project as any).specification;
    const arch = (project as any).architecture;
    const pir = (project as any).pir;
    const artifacts = (project as any).generatedArtifacts;

    // Collect all candidate files
    const candidateFiles: Array<{ path: string; content: string }> = [];

    // Add Specification, Architecture, PIR as JSON files
    candidateFiles.push({ path: 'specification/spec.json', content: JSON.stringify(spec, null, 2) });
    candidateFiles.push({ path: 'architecture/architecture.json', content: JSON.stringify(arch, null, 2) });
    candidateFiles.push({ path: 'pir/pir.json', content: JSON.stringify(pir, null, 2) });

    // Database SQL
    if (artifacts.databaseSchemaSQL) {
      candidateFiles.push({ path: 'database/schema.sql', content: artifacts.databaseSchemaSQL });
    }

    // Backend files
    if (Array.isArray(artifacts.backendFiles)) {
      for (const f of artifacts.backendFiles) {
        candidateFiles.push({ path: `backend/${String(f.path || '').replace(/^\/+/, '')}`, content: String(f.content || '') });
      }
    }

    // Frontend files
    if (Array.isArray(artifacts.frontendFiles)) {
      for (const f of artifacts.frontendFiles) {
        candidateFiles.push({ path: `frontend/${String(f.path || '').replace(/^\/+/, '')}`, content: String(f.content || '') });
      }
    }

    // Security / RBAC
    if (artifacts.rbacMatrix) {
      candidateFiles.push({ path: 'security/rbac-matrix.json', content: JSON.stringify(artifacts.rbacMatrix, null, 2) });
    }

    // API Contracts
    if (artifacts.apiContracts) {
      candidateFiles.push({ path: 'docs/api_contracts.json', content: JSON.stringify(artifacts.apiContracts, null, 2) });
    }

    // Validate artifacts safety
    const safety = this.validateArtifactsSafety(candidateFiles);
    if (!safety.passed) {
      throw new Error(safety.errors.join('; '));
    }

    // Generate README.md
    const readmeContent = `# ${project.name}
Generated by Kayan AI App Builder (Phase 8 - Secure Export Pipeline).

## Project Overview
- **Project ID**: ${project.id}
- **Version**: 1.0.0
- **Frontend Stack**: ${arch?.frontend?.framework || 'React'} (${arch?.frontend?.styling || 'Tailwind'})
- **Backend Stack**: ${arch?.backend?.runtime || 'Node.js'} / ${arch?.backend?.framework || 'Express'}
- **Database**: ${arch?.database?.engine || 'PostgreSQL'}

## Structure
- \`specification/\`: Application requirement specifications.
- \`architecture/\`: System architecture plan.
- \`pir/\`: Project Intermediate Representation (PIR).
- \`database/\`: Database migration SQL.
- \`backend/\`: Backend server source code.
- \`frontend/\`: Frontend client source code.
- \`security/\`: RBAC and authorization matrices.
- \`docs/\`: API contracts and technical specifications.
`;
    candidateFiles.push({ path: 'README.md', content: readmeContent });

    // Calculate file hashes and build manifest
    const manifestFiles: Array<{ path: string; sizeBytes: number; sha256: string }> = [];
    let totalBytes = 0;

    const zip = new AdmZip();

    // Sort files deterministically by path
    candidateFiles.sort((a, b) => a.path.localeCompare(b.path));

    for (const file of candidateFiles) {
      const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
      const contentBuffer = Buffer.from(file.content, 'utf8');
      const sizeBytes = contentBuffer.length;
      const sha256 = crypto.createHash('sha256').update(contentBuffer).digest('hex');

      manifestFiles.push({
        path: normalizedPath,
        sizeBytes,
        sha256
      });

      totalBytes += sizeBytes;
      zip.addFile(normalizedPath, contentBuffer);
    }

    const manifest: BuildManifest = {
      projectId: project.id,
      projectName: project.name,
      projectVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceSpecificationVersion: '1.0.0',
      architectureVersion: '1.0.0',
      pirVersion: '1.0.0',
      targetStack: {
        frontend: arch?.frontend?.framework || 'React',
        backend: arch?.backend?.framework || 'Express',
        database: arch?.database?.engine || 'PostgreSQL'
      },
      files: manifestFiles,
      totals: {
        files: manifestFiles.length,
        bytes: totalBytes
      },
      validation: {
        passed: true,
        errors: [],
        warnings: safety.warnings
      }
    };

    // Add MANIFEST.json to zip
    const manifestJson = JSON.stringify(manifest, null, 2);
    zip.addFile('MANIFEST.json', Buffer.from(manifestJson, 'utf8'));

    const zipBuffer = zip.toBuffer();
    return { manifest, zipBuffer };
  }
}
