import type { ExternalBuildProvider } from './ExternalBuildProvider.ts';
import { GitHubActionsBuildProvider } from './providers/GitHubActionsBuildProvider.ts';
import { androidBuildProvider } from './AndroidBuildProvider.ts';
import type { BuildRequest, BuildJob } from './BuildTypes.ts';

export class BuildOrchestrator {
  private providers: Map<string, ExternalBuildProvider> = new Map();

  constructor() {
    const ghProvider = new GitHubActionsBuildProvider();
    this.registerProvider(ghProvider);
    this.registerProvider(androidBuildProvider);
  }

  public registerProvider(provider: ExternalBuildProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public getProvider(providerId: string = 'github_actions'): ExternalBuildProvider {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.isConfigured()) {
      throw new Error('EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة البناء الخارجية (GitHub Actions) غير مهيأة حالياً.');
    }
    return provider;
  }

  /**
   * Validate build eligibility gate.
   */
  public validateBuildGate(project: any): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    const spec = project?.specification;
    const arch = project?.architecture;
    const pir = project?.pir;
    const artifacts = project?.generatedArtifacts;

    if (!spec) errors.push('BUILD_GATE_FAILED: Missing specification.');
    if (!arch) errors.push('BUILD_GATE_FAILED: Missing architecture.');
    if (!pir) errors.push('BUILD_GATE_FAILED: Missing PIR.');
    if (!artifacts) errors.push('BUILD_GATE_FAILED: Missing generated artifacts.');

    return {
      passed: errors.length === 0,
      errors
    };
  }

  public async submitBuild(request: BuildRequest, project: any, providerId?: string): Promise<BuildJob> {
    const gate = this.validateBuildGate(project);
    if (!gate.passed) {
      throw new Error(gate.errors.join('; '));
    }

    const effectiveProviderId = providerId || (request.targetPlatform === 'ANDROID' ? 'android_external_builder' : 'github_actions');
    const provider = this.getProvider(effectiveProviderId);
    return provider.createBuild(request);
  }

  public async getStatus(buildId: string, providerId?: string): Promise<BuildJob> {
    const provider = this.getProvider(providerId);
    return provider.getBuildStatus(buildId);
  }

  public async cancel(buildId: string, providerId?: string): Promise<boolean> {
    const provider = this.getProvider(providerId);
    return provider.cancelBuild(buildId);
  }
}

export const buildOrchestrator = new BuildOrchestrator();
