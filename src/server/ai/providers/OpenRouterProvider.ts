import type { IAIProvider } from '../AIProvider.ts';
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
} from '../types.ts';

export class OpenRouterProvider implements IAIProvider {
  public readonly id = 'openrouter';
  public readonly name = 'OpenRouter';

  public isConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }

  private unsupported(): never {
    throw new Error('AI_PROVIDER_NOT_IMPLEMENTED');
  }

  public async generateText(params: AIGenerateTextParams, apiKey?: string): Promise<AIGenerateTextResult> {
    this.unsupported();
  }

  public async generateImage(params: AIGenerateImageParams, apiKey?: string): Promise<AIGenerateImageResult> {
    this.unsupported();
  }

  public async generateVideo(params: AIGenerateVideoParams, apiKey?: string): Promise<AIGenerateVideoResult> {
    this.unsupported();
  }

  public async generateCode(params: AIGenerateCodeParams, apiKey?: string): Promise<AIGenerateCodeResult> {
    this.unsupported();
  }

  public async analyzeFile(params: AIAnalyzeFileParams, apiKey?: string): Promise<AIAnalyzeFileResult> {
    this.unsupported();
  }

  public async understandImage(params: AIUnderstandImageParams, apiKey?: string): Promise<AIUnderstandImageResult> {
    this.unsupported();
  }

  public async analyzeVision(params: AIVisionAnalyzeParams, apiKey?: string): Promise<AIVisionAnalyzeResult> {
    this.unsupported();
  }

  public async imageToPrompt(params: AIImageToPromptParams, apiKey?: string): Promise<AIImageToPromptResult> {
    this.unsupported();
  }

  public async analyzeUI(params: AIUIAnalyzeParams, apiKey?: string): Promise<AIUIAnalyzeResult> {
    this.unsupported();
  }

  public async screenshotToCode(params: AIScreenshotToCodeParams, apiKey?: string): Promise<AIScreenshotToCodeResult> {
    this.unsupported();
  }

  public async generateSpecification(prompt: string, apiKey?: string): Promise<ApplicationSpecification> {
    this.unsupported();
  }

  public async generateArchitecture(spec: ApplicationSpecification, apiKey?: string): Promise<ArchitecturePlan> {
    this.unsupported();
  }

  public async generatePIR(spec: ApplicationSpecification, arch: ArchitecturePlan, apiKey?: string): Promise<PIRProject> {
    this.unsupported();
  }

  public async validatePIR(pir: PIRProject, apiKey?: string): Promise<PIRValidationResult> {
    this.unsupported();
  }

  public async generateArtifacts(pir: PIRProject, apiKey?: string): Promise<AppBuilderArtifacts> {
    this.unsupported();
  }
}
