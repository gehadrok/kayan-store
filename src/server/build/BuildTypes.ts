export type BuildJobStatus =
  | 'QUEUED'
  | 'SUBMITTED'
  | 'BUILDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TargetPlatform = 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP';

export interface BuildRequest {
  userId: string;
  projectId: string;
  projectVersion: string;
  exportId: string;
  manifestChecksum: string;
  targetPlatform: TargetPlatform;
  targetStack: {
    frontend: string;
    backend: string;
    database: string;
  };
  buildProfile: string;
  sourceDownloadUrl?: string;
}

export interface BuildJob {
  buildId: string;
  userId: string;
  projectId: string;
  projectVersion: string;
  exportId: string;
  manifestChecksum: string;
  status: BuildJobStatus;
  targetPlatform: TargetPlatform;
  provider: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  artifacts?: Array<{
    type: string;
    fileName: string;
    sizeBytes: number;
    sha256: string;
    storageKey: string;
  }>;
  logs?: string[];
  error?: string;
}
