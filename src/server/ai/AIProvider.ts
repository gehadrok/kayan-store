import type {
  AIGenerateTextParams,
  AIGenerateTextResult,
  AIGenerateImageParams,
  AIGenerateImageResult,
  AIGenerateVideoParams,
  AIGenerateVideoResult,
  AIGenerateCodeParams,
  AIGenerateCodeResult,
  AIAnalyzeFileParams,
  AIAnalyzeFileResult,
  AIUnderstandImageParams,
  AIUnderstandImageResult,
  AIVisionAnalyzeParams,
  AIVisionAnalyzeResult,
  AIImageToPromptParams,
  AIImageToPromptResult,
  AIUIAnalyzeParams,
  AIUIAnalyzeResult,
  AIScreenshotToCodeParams,
  AIScreenshotToCodeResult,
  ApplicationSpecification,
  ArchitecturePlan,
  PIRProject,
  PIRValidationResult,
  AppBuilderArtifacts
} from './types.ts';

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  generateText(params: AIGenerateTextParams, apiKey?: string): Promise<AIGenerateTextResult>;
  generateImage(params: AIGenerateImageParams, apiKey?: string): Promise<AIGenerateImageResult>;
  generateVideo(params: AIGenerateVideoParams, apiKey?: string): Promise<AIGenerateVideoResult>;
  generateCode(params: AIGenerateCodeParams, apiKey?: string): Promise<AIGenerateCodeResult>;
  analyzeFile(params: AIAnalyzeFileParams, apiKey?: string): Promise<AIAnalyzeFileResult>;
  understandImage(params: AIUnderstandImageParams, apiKey?: string): Promise<AIUnderstandImageResult>;
  analyzeVision(params: AIVisionAnalyzeParams, apiKey?: string): Promise<AIVisionAnalyzeResult>;
  imageToPrompt(params: AIImageToPromptParams, apiKey?: string): Promise<AIImageToPromptResult>;
  analyzeUI(params: AIUIAnalyzeParams, apiKey?: string): Promise<AIUIAnalyzeResult>;
  screenshotToCode(params: AIScreenshotToCodeParams, apiKey?: string): Promise<AIScreenshotToCodeResult>;
  generateSpecification(prompt: string, apiKey?: string): Promise<ApplicationSpecification>;
  generateArchitecture(spec: ApplicationSpecification, apiKey?: string): Promise<ArchitecturePlan>;
  generatePIR(spec: ApplicationSpecification, arch: ArchitecturePlan, apiKey?: string): Promise<PIRProject>;
  validatePIR(pir: PIRProject, apiKey?: string): Promise<PIRValidationResult>;
  generateArtifacts(pir: PIRProject, apiKey?: string): Promise<AppBuilderArtifacts>;
}
