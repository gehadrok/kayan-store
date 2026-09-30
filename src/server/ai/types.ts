export interface AIGenerateTextParams {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIGenerateTextResult {
  text: string;
  model: string;
  providerId?: string;
  retryCount?: number;
  fallbackUsed?: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIGenerateImageParams {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '512px' | '1K' | '2K' | '4K';
  model?: string;
}

export interface AIGenerateImageResult {
  imageUrl?: string;
  imageBase64?: string;
  mimeType: string;
  model: string;
  providerId?: string;
  retryCount?: number;
  fallbackUsed?: boolean;
}

export interface AIGenerateVideoParams {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p' | '4k';
  model?: string;
}

export interface AIGenerateVideoResult {
  operationName: string;
  model: string;
}

export interface AICodeFile {
  path: string;
  content: string;
}

export interface AIGenerateCodeParams {
  prompt: string;
  language?: string;
  framework?: string;
  model?: string;
}

export interface AIGenerateCodeResult {
  summary: string;
  language?: string;
  framework?: string;
  files: AICodeFile[];
  warnings?: string[];
  model: string;
  providerId?: string;
  retryCount?: number;
  fallbackUsed?: boolean;
  code?: string;
}

export type AIErrorCode =
  | 'AI_PROVIDER_NOT_CONFIGURED'
  | 'AI_PROVIDER_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_REQUEST'
  | 'AI_RATE_LIMITED'
  | 'AI_STORAGE_ERROR'
  | 'AI_PROJECT_NOT_FOUND'
  | 'AI_JOB_NOT_FOUND'
  | 'AI_UNAUTHORIZED';

export interface AIAnalyzeFileParams {
  fileBuffer: Buffer;
  mimeType: string;
  fileName?: string;
  prompt: string;
  model?: string;
}

export interface AIAnalyzeFileResult {
  analysis: string;
  extractedMetadata?: Record<string, any>;
  model: string;
}

export interface AIUnderstandImageParams {
  imageBuffer: Buffer;
  mimeType: string;
  prompt: string;
  model?: string;
}

export interface AIUnderstandImageResult {
  description: string;
  labels?: string[];
  model: string;
}

export interface AIVisionAnalyzeParams {
  imageBuffer: Buffer;
  mimeType: string;
  instruction?: string;
  model?: string;
}

export interface AIVisionAnalyzeResult {
  description: string;
  objects: string[];
  subjects: string[];
  composition: string;
  visualStyle: string;
  colors: string[];
  lighting: string;
  layout: string;
  visibleText: string;
  observations: string[];
  inferences: string[];
  model: string;
  providerId?: string;
  retryCount?: number;
  fallbackUsed?: boolean;
}

export interface AIImageToPromptParams {
  imageBuffer: Buffer;
  mimeType: string;
  instruction?: string;
  model?: string;
}

export interface AIImageToPromptResult {
  prompt: string;
  negativePrompt: string;
  style: string;
  composition: string;
  lighting: string;
  subjects: string[];
  model: string;
}

export interface AIUIAnalyzeParams {
  imageBuffer: Buffer;
  mimeType: string;
  instruction?: string;
  model?: string;
}

export interface AIUIAnalyzeResult {
  pageType: string;
  layout: string;
  sections: string[];
  components: string[];
  typography: string;
  colors: string[];
  spacing: string;
  responsiveBehavior: string;
  observations: string[];
  inferences: string[];
  model: string;
}

export interface AIScreenshotToCodeParams {
  imageBuffer: Buffer;
  mimeType: string;
  framework?: string;
  language?: string;
  instruction?: string;
  model?: string;
}

export interface AIScreenshotToCodeResult {
  summary: string;
  framework: string;
  language: string;
  files: AICodeFile[];
  warnings: string[];
  model: string;
}

export interface ApplicationSpecification {
  name: string;
  description: string;
  targetPlatforms: string[];
  users: string[];
  roles: Array<{ name: string; description: string; permissions: string[] }>;
  modules: Array<{ name: string; description: string; features: string[] }>;
  entities: Array<{
    name: string;
    description: string;
    fields: Array<{ name: string; type: string; required?: boolean; unique?: boolean; isPrimary?: boolean; references?: string }>;
  }>;
  workflows: Array<{ name: string; steps: string[] }>;
  pages: Array<{ name: string; path: string; description: string; module: string }>;
  apis: Array<{ method: string; path: string; description: string; authRequired: boolean }>;
  integrations: string[];
  constraints: string[];
  assumptions?: string[];
  questions?: string[];
}

export interface ArchitecturePlan {
  frontend: { framework: string; styling: string; stateManagement: string };
  backend: { runtime: string; framework: string; architecture: string };
  database: { engine: string; ORM: string; schemaOverview: string };
  authentication: { strategy: string; tokenType: string };
  authorization: { model: string; rbac: boolean };
  storage: { provider: string; strategy: string };
  apiStructure: string;
  moduleDependencies: Array<{ module: string; dependsOn: string[] }>;
  deploymentModel: string;
}

export interface PIRProject {
  project: { name: string; description: string; version: string };
  modules: Array<{ id: string; name: string; description: string }>;
  entities: Array<{
    name: string;
    module: string;
    fields: Array<{ name: string; type: string; primaryKey?: boolean; nullable?: boolean; unique?: boolean; references?: string }>;
    relations: Array<{ type: 'hasMany' | 'belongsTo' | 'hasOne'; target: string; foreignKey: string }>;
  }>;
  apis: Array<{ method: string; path: string; module: string; auth: boolean }>;
  pages: Array<{ name: string; path: string; module: string; components: string[] }>;
  components: Array<{ name: string; type: string; props: string[] }>;
  workflows: Array<{ name: string; steps: string[] }>;
  roles: Array<{ name: string; permissions: string[] }>;
  dependencies: Array<{ from: string; to: string }>;
}

export interface PIRValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppBuilderArtifacts {
  databaseSchemaSQL: string;
  backendFiles: Array<{ path: string; content: string }>;
  frontendFiles: Array<{ path: string; content: string }>;
  apiContracts: Array<{ method: string; path: string; requestSample: any; responseSample: any }>;
  rbacMatrix: Array<{ role: string; permissions: string[] }>;
}

export interface AIProviderConfig {
  apiKey?: string;
  defaultModel?: string;
  timeoutMs?: number;
}
