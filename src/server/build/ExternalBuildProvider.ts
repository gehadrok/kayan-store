import type { BuildRequest, BuildJob } from './BuildTypes.ts';

export interface ExternalBuildProvider {
  readonly providerId: string;
  readonly name: string;
  isConfigured(): boolean;
  createBuild(request: BuildRequest): Promise<BuildJob>;
  getBuildStatus(buildId: string): Promise<BuildJob>;
  cancelBuild(buildId: string): Promise<boolean>;
}
