import type { IAIProvider } from './AIProvider.ts';
import { GeminiProvider } from './providers/GeminiProvider.ts';
import { OpenAIProvider } from './providers/OpenAIProvider.ts';
import { AnthropicProvider } from './providers/AnthropicProvider.ts';
import { OpenRouterProvider } from './providers/OpenRouterProvider.ts';
import { AIJobQueue } from './jobs/AIJobQueue.ts';
import { AIModelRouter, RouterInput } from './utils/AIModelRouter.ts';
import { db } from '../db.ts';
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

export class AIGateway {
  private providers: Map<string, IAIProvider> = new Map();
  public readonly jobQueue: AIJobQueue;

  constructor() {
    this.jobQueue = new AIJobQueue();
    // Register available providers
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new OpenRouterProvider());
  }

  public registerProvider(provider: IAIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): IAIProvider | undefined {
    return this.providers.get(id);
  }

  private async executeWithFallback<T>(
    capability: string,
    params: any,
    routerInput: Partial<RouterInput>,
    executor: (provider: IAIProvider, modelId: string, apiKey?: string) => Promise<T>
  ): Promise<T> {
    const settings = await db.getAISettings();
    const routeResult = await AIModelRouter.route({
      ...routerInput,
      capability
    });

    /**
     * FALLBACK POLICY: TOTAL ATTEMPTS
     * settings.maxRetryAttempts defines the total number of attempts (Initial + Retries).
     * Default is 3 (1 initial + 2 retries).
     */
    const maxAttempts = settings.maxRetryAttempts || 3;
    const candidates = routeResult.candidates.slice(0, maxAttempts);
    let lastError: any = null;
    let attempt = 0;

    for (const candidate of candidates) {
      attempt++;
      const provider = this.getProvider(candidate.providerId);
      if (!provider) continue;

      try {
        const result = await executor(provider, candidate.modelId, candidate.apiKey);

        // Add metadata to result
        if (result && typeof result === 'object') {
          (result as any).providerId = candidate.providerId;
          (result as any).model = candidate.modelId;
          (result as any).retryCount = attempt - 1;
          (result as any).fallbackUsed = attempt > 1;
        }

        return result;
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        const statusCode = err?.status || err?.statusCode;

        // RETRYABLE ERRORS:
        // - 429 (Rate Limit / Quota)
        // - 503 (Service Unavailable)
        // - 504 / 408 (Timeout)
        // - Transient failures (overloaded, busy)
        const isRetryable =
          statusCode === 429 ||
          statusCode === 503 ||
          statusCode === 504 ||
          statusCode === 408 ||
          msg.includes('quota') ||
          msg.includes('rate limit') ||
          msg.includes('unavailable') ||
          msg.includes('timeout') ||
          msg.includes('overloaded') ||
          msg.includes('busy') ||
          msg.includes('transient');

        // NON-RETRYABLE ERRORS (Fail immediately):
        // - 400 (Bad Request / Invalid Request)
        // - 401 / 403 (Unauthorized / Forbidden / Invalid Key)
        // - 404 (Model Not Found)
        // - Capability mismatches
        if (!isRetryable || attempt >= maxAttempts) {
          throw err;
        }

        console.warn(`[AIGateway] Attempt ${attempt}/${maxAttempts} with ${candidate.providerId}/${candidate.modelId} failed (Retryable). Trying fallback... Error: ${err.message}`);
      }
    }

    throw lastError || new Error('AI_NO_COMPATIBLE_MODEL');
  }

  public async generateText(params: AIGenerateTextParams, routerInput: Partial<RouterInput> = {}): Promise<AIGenerateTextResult> {
    return this.executeWithFallback('TEXT', params, routerInput, (p, model, key) =>
      p.generateText({ ...params, model }, key)
    );
  }

  public async generateImage(params: AIGenerateImageParams, routerInput: Partial<RouterInput> = {}): Promise<AIGenerateImageResult> {
    return this.executeWithFallback('IMAGE_GENERATION', params, routerInput, (p, model, key) =>
      p.generateImage({ ...params, model }, key)
    );
  }

  public async generateVideo(params: AIGenerateVideoParams, routerInput: Partial<RouterInput> = {}): Promise<AIGenerateVideoResult> {
    // Note: Video is usually a specific capability, but we'll use a placeholder if not explicitly defined in registry
    return this.executeWithFallback('VIDEO_GENERATION', params, routerInput, (p, model, key) =>
      p.generateVideo({ ...params, model }, key)
    );
  }

  public async generateCode(params: AIGenerateCodeParams, routerInput: Partial<RouterInput> = {}): Promise<AIGenerateCodeResult> {
    return this.executeWithFallback('CODE', params, routerInput, (p, model, key) =>
      p.generateCode({ ...params, model }, key)
    );
  }

  public async analyzeFile(params: AIAnalyzeFileParams, routerInput: Partial<RouterInput> = {}): Promise<AIAnalyzeFileResult> {
    return this.executeWithFallback('DOCUMENT_ANALYSIS', params, routerInput, (p, model, key) =>
      p.analyzeFile({ ...params, model }, key)
    );
  }

  public async understandImage(params: AIUnderstandImageParams, routerInput: Partial<RouterInput> = {}): Promise<AIUnderstandImageResult> {
    return this.executeWithFallback('VISION', params, routerInput, (p, model, key) =>
      p.understandImage({ ...params, model }, key)
    );
  }

  public async analyzeVision(params: AIVisionAnalyzeParams, routerInput: Partial<RouterInput> = {}): Promise<AIVisionAnalyzeResult> {
    return this.executeWithFallback('VISION', params, routerInput, (p, model, key) =>
      p.analyzeVision({ ...params, model }, key)
    );
  }

  public async imageToPrompt(params: AIImageToPromptParams, routerInput: Partial<RouterInput> = {}): Promise<AIImageToPromptResult> {
    return this.executeWithFallback('IMAGE_TO_PROMPT', params, routerInput, (p, model, key) =>
      p.imageToPrompt({ ...params, model }, key)
    );
  }

  public async analyzeUI(params: AIUIAnalyzeParams, routerInput: Partial<RouterInput> = {}): Promise<AIUIAnalyzeResult> {
    return this.executeWithFallback('UI_ANALYSIS', params, routerInput, (p, model, key) =>
      p.analyzeUI({ ...params, model }, key)
    );
  }

  public async screenshotToCode(params: AIScreenshotToCodeParams, routerInput: Partial<RouterInput> = {}): Promise<AIScreenshotToCodeResult> {
    return this.executeWithFallback('SCREENSHOT_TO_CODE', params, routerInput, (p, model, key) =>
      p.screenshotToCode({ ...params, model }, key)
    );
  }

  public async generateSpecification(prompt: string, routerInput: Partial<RouterInput> = {}): Promise<ApplicationSpecification> {
    return this.executeWithFallback('APP_REQUIREMENTS', { prompt }, routerInput, (p, model, key) =>
      p.generateSpecification(prompt, key)
    );
  }

  public async generateArchitecture(spec: ApplicationSpecification, routerInput: Partial<RouterInput> = {}): Promise<ArchitecturePlan> {
    return this.executeWithFallback('APP_ARCHITECTURE', { spec }, routerInput, (p, model, key) =>
      p.generateArchitecture(spec, key)
    );
  }

  public async generatePIR(spec: ApplicationSpecification, arch: ArchitecturePlan, routerInput: Partial<RouterInput> = {}): Promise<PIRProject> {
    return this.executeWithFallback('APP_PIR', { spec, arch }, routerInput, (p, model, key) =>
      p.generatePIR(spec, arch, key)
    );
  }

  public async validatePIR(pir: PIRProject, routerInput: Partial<RouterInput> = {}): Promise<PIRValidationResult> {
    // Validation is usually local or fast, but we'll use APP_PIR as capability
    return this.executeWithFallback('APP_PIR', { pir }, routerInput, (p, model, key) =>
      p.validatePIR(pir, key)
    );
  }

  public async generateArtifacts(pir: PIRProject, routerInput: Partial<RouterInput> = {}): Promise<AppBuilderArtifacts> {
    return this.executeWithFallback('APP_FRONTEND', { pir }, routerInput, (p, model, key) =>
      p.generateArtifacts(pir, key)
    );
  }
}

export const aiGateway = new AIGateway();
