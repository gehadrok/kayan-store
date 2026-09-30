import crypto from 'crypto';
import type { ExternalBuildProvider } from '../ExternalBuildProvider.ts';
import type { BuildRequest, BuildJob } from '../BuildTypes.ts';

const SHA256_REGEX = /^[a-fA-F0-9]{64}$/;

export class GitHubActionsBuildProvider implements ExternalBuildProvider {
  public readonly providerId = 'github_actions';
  public readonly name = 'GitHub Actions Isolated Builder';
  private jobsMap: Map<string, BuildJob> = new Map();

  public isConfigured(): boolean {
    return Boolean(process.env.GITHUB_ACTIONS_TOKEN && process.env.GITHUB_REPOSITORY);
  }

  /**
   * Dispatches a real external build workflow to GitHub Actions.
   * Fails-closed if external builder or remote export source is unavailable.
   */
  public async createBuild(request: BuildRequest): Promise<BuildJob> {
    if (!this.isConfigured()) {
      throw new Error('EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة البناء الخارجية (GitHub Actions) غير مهيأة حالياً.');
    }

    if (!request.exportId || typeof request.exportId !== 'string' || request.exportId.trim().length === 0) {
      throw new Error('BUILD_INPUT_INTEGRITY_FAILED: exportId is required and must reference an immutable export.');
    }

    if (!request.manifestChecksum || !SHA256_REGEX.test(request.manifestChecksum.trim())) {
      throw new Error('BUILD_INPUT_INTEGRITY_FAILED: manifestChecksum must be a valid 64-character SHA-256 hex string.');
    }

    const buildId = 'build_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    // Verify whether the immutable export source is securely available to external GitHub Actions runners
    const sourceUrl = request.sourceDownloadUrl ? request.sourceDownloadUrl.trim() : '';
    const isRemoteUrl = Boolean(
      sourceUrl.startsWith('https://') ||
      (sourceUrl.startsWith('http://') && !sourceUrl.includes('localhost') && !sourceUrl.includes('127.0.0.1'))
    );

    if (!isRemoteUrl) {
      // Ephemeral local disk storage cannot be reached by GitHub cloud runners
      const failedJob: BuildJob = {
        buildId,
        userId: request.userId,
        projectId: request.projectId,
        projectVersion: request.projectVersion,
        exportId: request.exportId,
        manifestChecksum: request.manifestChecksum,
        status: 'FAILED',
        targetPlatform: request.targetPlatform,
        provider: this.providerId,
        createdAt: now,
        updatedAt: now,
        error: 'BUILD_SOURCE_UNAVAILABLE',
        logs: [
          '[ERROR] External build runner cannot access local ephemeral export source.',
          `[ERROR] Unusable local export source path: "${sourceUrl || 'none'}".`,
          '[INFO] Required production infrastructure: Configure STORAGE_DRIVER=s3 with valid S3_ENDPOINT and S3_BUCKET, or STORAGE_DRIVER=github with GITHUB_TOKEN to enable external GitHub Actions runners to securely fetch the immutable export package.'
        ]
      };
      this.jobsMap.set(buildId, failedJob);
      throw new Error('BUILD_SOURCE_UNAVAILABLE: حزمة التصدير غير متاحة لباني GitHub Actions الخارجي بشكل آمن. يتطلب إعداد تخزين سحابي خارجي (S3 أو GitHub Release Storage).');
    }

    const job: BuildJob = {
      buildId,
      userId: request.userId,
      projectId: request.projectId,
      projectVersion: request.projectVersion,
      exportId: request.exportId,
      manifestChecksum: request.manifestChecksum,
      status: 'SUBMITTED',
      targetPlatform: request.targetPlatform,
      provider: this.providerId,
      createdAt: now,
      updatedAt: now,
      logs: [
        `[INFO] Target platform: ${request.targetPlatform}`,
        `[INFO] Build profile: ${request.buildProfile || 'default'}`,
        `[INFO] Export ID: ${request.exportId}`,
        `[INFO] Manifest checksum: ${request.manifestChecksum}`,
        `[INFO] Source URL verified for external builder: ${sourceUrl}`,
        '[INFO] Dispatching build workflow to GitHub Actions...'
      ]
    };

    const repo = process.env.GITHUB_REPOSITORY || '';
    const token = process.env.GITHUB_ACTIONS_TOKEN || '';
    const [owner, repoName] = repo.split('/');

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/actions/workflows/android-build.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'Kayan-Store'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            buildId,
            projectId: request.projectId,
            exportId: request.exportId,
            projectVersion: request.projectVersion,
            manifestChecksum: request.manifestChecksum,
            targetPlatform: request.targetPlatform,
            buildProfile: request.buildProfile || 'default',
            sourceDownloadUrl: sourceUrl
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        job.status = 'FAILED';
        job.error = `GITHUB_DISPATCH_FAILED: ${response.status} ${response.statusText} - ${errorText}`;
        job.logs?.push(`[ERROR] GitHub Actions workflow dispatch failed with status ${response.status}: ${errorText}`);
        this.jobsMap.set(buildId, job);
        throw new Error(job.error);
      }

      job.status = 'BUILDING';
      job.logs?.push('[INFO] Successfully dispatched build workflow via GitHub REST API.');
      this.jobsMap.set(buildId, job);
      return job;
    } catch (apiError: any) {
      if (!job.error) {
        job.status = 'FAILED';
        job.error = `BUILD_SUBMISSION_FAILED: ${apiError.message}`;
        job.logs?.push(`[ERROR] Network error during dispatch: ${apiError.message}`);
        this.jobsMap.set(buildId, job);
      }
      throw apiError;
    }
  }

  public async getBuildStatus(buildId: string): Promise<BuildJob> {
    const job = this.jobsMap.get(buildId);
    if (!job) {
      throw new Error('Build job not found.');
    }
    return job;
  }

  public async cancelBuild(buildId: string): Promise<boolean> {
    const job = this.jobsMap.get(buildId);
    if (!job) return false;
    job.status = 'CANCELLED';
    job.updatedAt = new Date().toISOString();
    return true;
  }
}
