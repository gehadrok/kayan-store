import type { ExternalBuildProvider } from './ExternalBuildProvider.ts';
import type { BuildRequest, BuildJob } from './BuildTypes.ts';
import { GitHubActionsBuildProvider } from './providers/GitHubActionsBuildProvider.ts';

export interface AndroidBuildRequest extends BuildRequest {
  targetFormat?: 'ANDROID_APK' | 'ANDROID_AAB';
  signingMode?: 'UNSIGNED' | 'RELEASE_SIGNED';
  packageName?: string;
  versionName?: string;
  versionCode?: number;
}

const PACKAGE_NAME_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const SHA256_REGEX = /^[a-fA-F0-9]{64}$/;

export class AndroidBuildProvider implements ExternalBuildProvider {
  public readonly providerId = 'android_external_builder';
  public readonly name = 'External Android APK/AAB Builder';
  private ghProvider = new GitHubActionsBuildProvider();
  private jobsMap: Map<string, BuildJob> = new Map();

  public isConfigured(): boolean {
    return this.ghProvider.isConfigured();
  }

  public isSigningConfigured(): boolean {
    return Boolean(process.env.ANDROID_KEYSTORE && process.env.KEYSTORE_PASSWORD);
  }

  public validatePackageName(packageName: string): boolean {
    return PACKAGE_NAME_REGEX.test(packageName);
  }

  /**
   * Validates Android parameters and delegates actual execution to the external GitHub Actions builder.
   * Fails-closed and never generates synthetic APK artifacts or claims success without real remote dispatch.
   */
  public async createBuild(request: AndroidBuildRequest): Promise<BuildJob> {
    if (!this.isConfigured()) {
      throw new Error('EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة بناء أندرويد الخارجية (GitHub Actions) غير مهيأة.');
    }

    if (!request.exportId || typeof request.exportId !== 'string' || request.exportId.trim().length === 0) {
      throw new Error('BUILD_INPUT_INTEGRITY_FAILED: exportId is required and must reference an immutable project export.');
    }

    if (!request.manifestChecksum || !SHA256_REGEX.test(request.manifestChecksum.trim())) {
      throw new Error('BUILD_INPUT_INTEGRITY_FAILED: manifestChecksum must be a valid 64-character SHA-256 hexadecimal hash.');
    }

    if (!request.packageName || !this.validatePackageName(request.packageName)) {
      throw new Error('ANDROID_PACKAGE_ID_INVALID: Invalid Android package identifier (e.g. com.example.app required).');
    }

    if (request.signingMode === 'RELEASE_SIGNED' && !this.isSigningConfigured()) {
      throw new Error('ANDROID_SIGNING_NOT_CONFIGURED: Release signing keystore secrets are not configured in the external build environment.');
    }

    // Delegate the actual remote build dispatch to the external GitHub Actions builder
    const job = await this.ghProvider.createBuild({
      ...request,
      targetPlatform: 'ANDROID'
    });

    this.jobsMap.set(job.buildId, job);
    return job;
  }

  public async getBuildStatus(buildId: string): Promise<BuildJob> {
    const job = this.jobsMap.get(buildId);
    if (job) return job;
    return this.ghProvider.getBuildStatus(buildId);
  }

  public async cancelBuild(buildId: string): Promise<boolean> {
    const job = this.jobsMap.get(buildId);
    if (!job) return false;
    job.status = 'CANCELLED';
    job.updatedAt = new Date().toISOString();
    return this.ghProvider.cancelBuild(buildId);
  }
}

export const androidBuildProvider = new AndroidBuildProvider();
