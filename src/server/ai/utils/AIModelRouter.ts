import { db } from '../../db.ts';
import { decrypt } from './encryption.ts';
import { AIModelConfig, AIProviderConfig } from '../../../types.ts';

export interface RouterInput {
  capability: string;
  userId?: string;
  projectId?: string;
  preferredModel?: string;
  providerPreference?: string;
  freeOnly?: boolean;
  routingMode?: 'AUTO' | 'FREE_FIRST' | 'USER_SELECTED' | 'PROVIDER_SELECTED';
}

export interface RouteCandidate {
  providerId: string;
  modelId: string;
  apiKey?: string;
  isCustomKey: boolean;
  priority: number;
}

export interface RouterOutput {
  providerId: string;
  modelId: string;
  apiKey?: string;
  isCustomKey: boolean;
  candidates: RouteCandidate[];
}

export class AIModelRouter {
  /**
   * Routes an AI request to the most suitable provider & model candidate list.
   */
  public static async route(input: RouterInput): Promise<RouterOutput> {
    const { capability, userId, preferredModel, providerPreference, routingMode = 'AUTO', freeOnly = false } = input;
    const settings = await db.getAISettings();

    // 1. Fetch active providers and registered models
    const allProviders = await db.getAIProviders();
    const liveProviders = new Set(allProviders.filter(p => p.status === 'LIVE').map(p => p.id));

    const allModels = await db.getAIModels();
    
    // Filter by LIVE status and basic activity
    let compatibleModels = allModels.filter(m => 
      m.active && 
      liveProviders.has(m.providerId)
    );

    // 2. Filter models by requested capability (Mandatory)
    compatibleModels = compatibleModels.filter(m => m.capabilities.includes(capability));

    // 3. Filter by freeOnly or allowPaidFallback
    if (freeOnly) {
      compatibleModels = compatibleModels.filter(m => m.freeTierStatus === 'FREE');
    }

    if (compatibleModels.length === 0) {
      throw new Error('AI_MODEL_CAPABILITY_MISMATCH');
    }

    // 3. Resolve user keys (BYOK) if userId is specified
    const userKeys = userId ? await db.getUserKeys(userId) : [];
    const userKeyMap = new Map<string, string>();
    for (const uk of userKeys) {
      try {
        const plainKey = decrypt(uk.encryptedApiKey, uk.ivHex, uk.tagHex);
        if (plainKey) {
          userKeyMap.set(uk.providerId, plainKey);
        }
      } catch (e) {
        console.error(`Failed to decrypt user key for provider ${uk.providerId}:`, e);
      }
    }

    // 4. Score compatible models based on the selected mode
    const scoredCandidates: RouteCandidate[] = [];

    for (const model of compatibleModels) {
      let score = model.priority || 0;

      const customKey = userKeyMap.get(model.providerId);
      const hasCustomKey = !!customKey;

      // Extract proper key
      const apiKey = customKey || (model.providerId === 'gemini' ? process.env.GEMINI_API_KEY :
                                    model.providerId === 'openai' ? process.env.OPENAI_API_KEY : undefined);

      // Scoring logic adjustments
      if (routingMode === 'USER_SELECTED' && preferredModel && model.modelId === preferredModel) {
        score += 10000;
      } else if (routingMode === 'FREE_FIRST') {
        if (model.freeTierStatus === 'FREE') {
          score += 1000;
        } else {
          score -= 500;
        }
      } else if (routingMode === 'PROVIDER_SELECTED' && providerPreference && model.providerId === providerPreference) {
        score += 5000;
      }

      // Bonus score for defaults
      if (model.defaultForCapability === capability) {
        score += 100;
      }

      // Small bonus for custom key availability
      if (hasCustomKey) {
        score += 50;
      }

      scoredCandidates.push({
        providerId: model.providerId,
        modelId: model.modelId,
        apiKey,
        isCustomKey: hasCustomKey,
        priority: score
      });
    }

    // Sort by priority descending
    scoredCandidates.sort((a, b) => b.priority - a.priority);

    if (scoredCandidates.length === 0) {
      throw new Error('AI_NO_COMPATIBLE_MODEL');
    }

    // 5. Apply Paid Fallback Policy
    // If global settings prohibit paid fallback, we remove paid models from candidates 
    // EXCEPT possibly the primary one if it was explicitly selected by user.
    let finalCandidates = scoredCandidates;
    if (!settings.allowPaidFallback && !freeOnly) {
      finalCandidates = scoredCandidates.filter((cand, idx) => {
        // Keep if it's the primary (first) candidate
        if (idx === 0) return true;
        // Keep if user has custom key (BYOK overrides global fallback policy for that user)
        if (cand.isCustomKey) return true;
        // Check if model is free
        const modelInfo = compatibleModels.find(m => m.modelId === cand.modelId);
        return modelInfo?.freeTierStatus === 'FREE';
      });
    }

    const primary = finalCandidates[0];

    return {
      providerId: primary.providerId,
      modelId: primary.modelId,
      apiKey: primary.apiKey,
      isCustomKey: primary.isCustomKey,
      candidates: finalCandidates
    };
  }
}
