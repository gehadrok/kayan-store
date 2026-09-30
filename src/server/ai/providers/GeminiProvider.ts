import { GoogleGenAI } from '@google/genai';
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

function translateError(err: any): Error {
  if (!err) return new Error('حدث خطأ غير معروف في خادم الذكاء الاصطناعي (Unknown AI Error)');

  const originalMessage = err?.message || String(err);

  // Try to parse as JSON if it contains JSON payload
  let apiError: any = null;
  try {
    const jsonMatch = originalMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      apiError = JSON.parse(jsonMatch[0]);
    } else {
      apiError = JSON.parse(originalMessage);
    }
  } catch {
    // not a valid JSON error message
  }

  const code = apiError?.error?.code || apiError?.code;
  const status = apiError?.error?.status || apiError?.status;
  const message = apiError?.error?.message || apiError?.message || originalMessage;

  // Sanitize message to strictly redact any API Keys (e.g. AIzaSy...)
  const sanitize = (str: string): string => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/AIzaSy[a-zA-Z0-9-_]{35}/g, '[REDACTED_API_KEY]');
  };

  const cleanMessage = sanitize(message);

  // 1. Quota / Rate limit (RESOURCE_EXHAUSTED / 429)
  if (
    code === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    cleanMessage.includes('quota') ||
    cleanMessage.includes('RESOURCE_EXHAUSTED') ||
    cleanMessage.includes('Rate limit') ||
    cleanMessage.includes('429') ||
    originalMessage.includes('quota') ||
    originalMessage.includes('RESOURCE_EXHAUSTED') ||
    originalMessage.includes('limit')
  ) {
    // Extract retry time if available safely (e.g. 48s or 48.066s)
    let delayInfo = '';
    const delayMatch = originalMessage.match(/retry in ([\d\.]+s)/i) || originalMessage.match(/Please retry after (\d+)/i) || originalMessage.match(/retryDelay":"?(\d+s|\d+)"?/i);
    if (delayMatch && delayMatch[1]) {
      delayInfo = ` يرجى المحاولة مجدداً بعد ${delayMatch[1]}.`;
    }

    return new Error(
      `تم تجاوز حد الاستهلاك المجاني لخدمة الذكاء الاصطناعي مؤقتاً (Rate Limit / Quota Exceeded).${delayInfo} الرجاء الانتظار قليلاً ثم المحاولة مرة أخرى.`
    );
  }

  // 2. Authentication / API Key issues (401)
  if (
    code === 401 ||
    cleanMessage.includes('API key') ||
    cleanMessage.includes('not valid') ||
    cleanMessage.includes('unauthorized') ||
    cleanMessage.includes('invalid credentials')
  ) {
    return new Error(
      'فشل التحقق من مفتاح الوصول لخدمة الذكاء الاصطناعي (API Key Invalid). الرجاء التأكد من تهيئة بيئة العمل بشكل صحيح.'
    );
  }

  // 3. Access Forbidden (403)
  if (
    code === 403 ||
    status === 'PERMISSION_DENIED' ||
    cleanMessage.includes('forbidden') ||
    cleanMessage.includes('permission denied') ||
    cleanMessage.includes('access denied')
  ) {
    return new Error(
      'الوصول إلى خدمة الذكاء الاصطناعي مرفوض. يرجى مراجعة الصلاحيات أو قيود النطاق الجغرافي للنموذج (AI Access Forbidden).'
    );
  }

  // 4. Model Not Found (404)
  if (
    code === 404 ||
    status === 'NOT_FOUND' ||
    cleanMessage.includes('not found') ||
    cleanMessage.includes('no longer available') ||
    cleanMessage.includes('unknown model')
  ) {
    return new Error(
      'نموذج الذكاء الاصطناعي المطلوب غير متوفر حالياً أو غير مدعوم في هذا النطاق (AI Model Not Found).'
    );
  }

  // 5. Service unavailable / Overloaded / Gateway issues (503 / 504 / 502)
  if (
    code === 503 ||
    code === 504 ||
    code === 502 ||
    status === 'UNAVAILABLE' ||
    cleanMessage.includes('overloaded') ||
    cleanMessage.includes('unavailable') ||
    cleanMessage.includes('gateway')
  ) {
    return new Error(
      'خادم الذكاء الاصطناعي يواجه ضغطاً كبيراً حالياً أو غير متاح مؤقتاً. يرجى إعادة المحاولة بعد ثوانٍ قليلة.'
    );
  }

  // 6. Bad / Invalid Request (400)
  if (
    code === 400 ||
    status === 'INVALID_ARGUMENT' ||
    cleanMessage.includes('invalid') ||
    cleanMessage.includes('bad request')
  ) {
    return new Error(
      `طلب غير صالح أو معطيات خاطئة مرسلة لخدمة الذكاء الاصطناعي: ${cleanMessage}`
    );
  }

  // 7. Internal Server Error (500)
  if (code === 500 || status === 'INTERNAL') {
    return new Error(
      'حدث خطأ داخلي لدى مزود خدمة الذكاء الاصطناعي (AI Internal Server Error). يرجى إعادة المحاولة لاحقاً.'
    );
  }

  // General Normalization: never leak raw JSON structures
  return new Error(cleanMessage);
}

const FALLBACK_MODELS: Record<string, string[]> = {
  'gemini-3.8-flash': ['gemini-3.5-flash-lite'],
  'gemini-3.1-pro-preview': ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
  'gemini-3.1-flash-lite-image': ['gemini-3.8-flash', 'gemini-3.5-flash-lite']
};

function checkIsRateLimit(err: any): boolean {
  if (!err) return false;
  const originalMessage = err?.message || String(err);
  let apiError: any = null;
  try {
    const jsonMatch = originalMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      apiError = JSON.parse(jsonMatch[0]);
    } else {
      apiError = JSON.parse(originalMessage);
    }
  } catch {
    // ignore
  }

  const code = apiError?.error?.code || apiError?.code;
  const status = apiError?.error?.status || apiError?.status;
  const message = apiError?.error?.message || apiError?.message || originalMessage;

  return (
    code === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('quota') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Rate limit') ||
    message.includes('429') ||
    originalMessage.includes('quota') ||
    originalMessage.includes('RESOURCE_EXHAUSTED') ||
    originalMessage.includes('limit')
  );
}

export class GeminiProvider implements IAIProvider {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini API';
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }

  public isConfigured(): boolean {
    return this.aiClient !== null;
  }

  private ensureConfigured(customKey?: string): GoogleGenAI {
    let clientInstance = this.aiClient;
    if (customKey) {
      clientInstance = new GoogleGenAI({
        apiKey: customKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }

    if (!clientInstance) {
      throw new Error('AI provider is not configured. Missing GEMINI_API_KEY.');
    }

    // Create a dynamic proxy on the Gemini client to automatically catch, fallback, and translate all API errors centrally
    return new Proxy(clientInstance, {
      get(target, prop) {
        const val = Reflect.get(target, prop);
        if (prop === 'models' && val) {
          return new Proxy(val, {
            get(modelsTarget, modelsProp) {
              const modelsVal = Reflect.get(modelsTarget, modelsProp);
              if (typeof modelsVal === 'function') {
                return async function (...args: any[]) {
                  const reqArg = args[0];
                  const currentModel = reqArg?.model;

                  try {
                    return await modelsVal.apply(modelsTarget, args);
                  } catch (err: any) {
                    // Centralized Self-Healing Auto-Fallback retries
                    const isRateLimit = checkIsRateLimit(err);
                    if (isRateLimit && reqArg && typeof reqArg === 'object' && currentModel) {
                      const fallbacks = FALLBACK_MODELS[currentModel] || [];
                      for (const fbModel of fallbacks) {
                        console.warn(`[GeminiProvider] Quota exceeded for model "${currentModel}". Retrying automatically with fallback "${fbModel}"...`);
                        try {
                          const fallbackArgs = [{ ...reqArg, model: fbModel }, ...args.slice(1)];
                          return await modelsVal.apply(modelsTarget, fallbackArgs);
                        } catch (fallbackErr: any) {
                          console.error(`[GeminiProvider] Fallback model "${fbModel}" also failed:`, fallbackErr?.message || fallbackErr);
                        }
                      }
                    }
                    throw translateError(err);
                  }
                };
              }
              return modelsVal;
            }
          });
        }
        return val;
      }
    }) as any;
  }

  public async generateText(params: AIGenerateTextParams, apiKey?: string): Promise<AIGenerateTextResult> {
    const client = this.ensureConfigured(apiKey);
    const model = params.model || 'gemini-3.8-flash';
    const response = await client.models.generateContent({
      model,
      contents: params.prompt,
      config: params.systemInstruction ? { systemInstruction: params.systemInstruction } : undefined
    });

    if (!response.text) {
      throw new Error('Gemini API returned an empty text response.');
    }

    return {
      text: response.text,
      model
    };
  }

  public async generateImage(params: AIGenerateImageParams, apiKey?: string): Promise<AIGenerateImageResult> {
    const client = this.ensureConfigured(apiKey);
    const model = params.model || 'gemini-3.1-flash-lite-image';
    const response = await client.models.generateContent({
      model,
      contents: { parts: [{ text: params.prompt }] },
      config: {
        imageConfig: {
          aspectRatio: params.aspectRatio || '1:1'
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
          model
        };
      }
    }

    throw new Error('No image part returned from Gemini image generation API.');
  }

  public async generateVideo(params: AIGenerateVideoParams, apiKey?: string): Promise<AIGenerateVideoResult> {
    const client = this.ensureConfigured(apiKey);
    const model = params.model || 'veo-3.1-lite-generate-preview';
    const operation = await client.models.generateVideos({
      model,
      prompt: params.prompt,
      config: {
        numberOfVideos: 1,
        resolution: params.resolution || '720p',
        aspectRatio: params.aspectRatio || '16:9'
      }
    });

    if (!operation.name) {
      throw new Error('Failed to obtain video operation name from Veo API.');
    }

    return {
      operationName: operation.name,
      model
    };
  }

  public async generateCode(params: AIGenerateCodeParams, apiKey?: string): Promise<AIGenerateCodeResult> {
    const client = this.ensureConfigured(apiKey);
    const model = params.model || 'gemini-3.1-pro-preview';
    const systemPrompt = `You are an expert software engineer.
Generate clean, production-ready code in structured JSON format according to the user request.
Your response MUST be a single valid JSON object formatted as follows:
{
  "summary": "Brief summary of what was generated",
  "language": "${params.language || 'TypeScript'}",
  "framework": "${params.framework || 'React'}",
  "files": [
    {
      "path": "relative/file/path.ext",
      "content": "full source code here..."
    }
  ],
  "warnings": []
}`;

    const response = await client.models.generateContent({
      model,
      contents: params.prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback if JSON parse fails
    }

    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      const sanitizedFiles = parsed.files.map((f: any) => {
        let cleanPath = String(f.path || 'index.ts')
          .replace(/\\/g, '/')
          .replace(/\.\.+/g, '')
          .replace(/^\/+/, '')
          .replace(/[\0\x00-\x1F]/g, '');
        if (!cleanPath) cleanPath = 'src/index.ts';
        return {
          path: cleanPath,
          content: String(f.content || '')
        };
      });

      return {
        summary: parsed.summary || 'Code generated successfully',
        language: parsed.language || params.language || 'TypeScript',
        framework: parsed.framework || params.framework,
        files: sanitizedFiles,
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        model,
        code: sanitizedFiles.map((f: { path: string; content: string }) => `// File: ${f.path}\n${f.content}`).join('\n\n')
      };
    }

    const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const fallbackCode = codeMatch ? codeMatch[1].trim() : text.trim();
    const defaultPath = params.framework?.toLowerCase().includes('react') ? 'src/App.tsx' : 'src/index.ts';

    return {
      summary: 'Generated source code',
      language: params.language || 'TypeScript',
      framework: params.framework,
      files: [{ path: defaultPath, content: fallbackCode }],
      warnings: [],
      model,
      code: fallbackCode
    };
  }

  public async analyzeFile(params: AIAnalyzeFileParams): Promise<AIAnalyzeFileResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const filePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.fileBuffer.toString('base64')
      }
    };

    const response = await client.models.generateContent({
      model,
      contents: { parts: [filePart, { text: params.prompt }] }
    });

    return {
      analysis: response.text || '',
      model
    };
  }

  public async understandImage(params: AIUnderstandImageParams): Promise<AIUnderstandImageResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const imagePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBuffer.toString('base64')
      }
    };

    const response = await client.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: params.prompt }] }
    });

    return {
      description: response.text || '',
      model
    };
  }

  public async analyzeVision(params: AIVisionAnalyzeParams): Promise<AIVisionAnalyzeResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const imagePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBuffer.toString('base64')
      }
    };

    const systemInstruction = `You are an expert computer vision AI system.
Analyze the provided image in detail and return a strictly valid JSON object matching this schema:
{
  "description": "Comprehensive objective description of the image content",
  "objects": ["detected object 1", "detected object 2"],
  "subjects": ["primary subject 1", "subject 2"],
  "composition": "Explanation of visual composition, framing, rule of thirds, angles, etc.",
  "visualStyle": "Artistic or photographic style (e.g., realistic photograph, flat vector, watercolor, 3D render, etc.)",
  "colors": ["dominant color 1", "accent color 2"],
  "lighting": "Description of lighting source, direction, intensity, and shadows",
  "layout": "Spatial arrangement and visual balance",
  "visibleText": "Any text clearly visible within the image (or empty string if none)",
  "observations": ["Factually observed detail 1", "Factually observed detail 2"],
  "inferences": ["Reasonable contextual inference 1", "Reasonable contextual inference 2"]
}
CRITICAL RULES:
- Distinguish strictly between what is directly observed vs what is contextually inferred.
- Do not invent information that cannot be seen or inferred from the image.
- Return ONLY valid JSON.`;

    const promptText = params.instruction
      ? `User instruction: ${params.instruction}\n\nPlease analyze the image thoroughly according to the schema.`
      : 'Please analyze this image thoroughly according to the schema.';

    const response = await client.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }
    }

    if (parsed && typeof parsed.description === 'string') {
      return {
        description: parsed.description,
        objects: Array.isArray(parsed.objects) ? parsed.objects : [],
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
        composition: parsed.composition || '',
        visualStyle: parsed.visualStyle || '',
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        lighting: parsed.lighting || '',
        layout: parsed.layout || '',
        visibleText: parsed.visibleText || '',
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        inferences: Array.isArray(parsed.inferences) ? parsed.inferences : [],
        model
      };
    }

    return {
      description: text.trim() || 'Image analysis completed.',
      objects: [],
      subjects: [],
      composition: '',
      visualStyle: '',
      colors: [],
      lighting: '',
      layout: '',
      visibleText: '',
      observations: [text.trim()],
      inferences: [],
      model
    };
  }

  public async imageToPrompt(params: AIImageToPromptParams): Promise<AIImageToPromptResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const imagePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBuffer.toString('base64')
      }
    };

    const systemInstruction = `You are an expert AI prompt engineer specializing in reverse engineering images into high-precision generative AI prompts.
Analyze the provided image and generate a reverse-engineered prompt specification in strictly valid JSON:
{
  "prompt": "Detailed generative prompt describing subject, environment, lighting, angle, art style, textures, and details in English",
  "negativePrompt": "Elements to avoid such as blurry, low quality, artifacts, distorted anatomy, text artifacts",
  "style": "Exact visual art or camera style (e.g. Cinematic 35mm film photography, anime cel-shaded, isometric 3D)",
  "composition": "Camera lens, focal length, shot angle, and framing description",
  "lighting": "Lighting setup (e.g. Golden hour backlighting, dramatic chiaroscuro, studio softbox)",
  "subjects": ["main subject 1", "key detail 2"]
}
CRITICAL RULES:
- The output prompt must be rich, vivid, descriptive, and actionable.
- Return ONLY valid JSON.`;

    const promptText = params.instruction
      ? `User instruction: ${params.instruction}\n\nReverse engineer this image into a generative prompt.`
      : 'Reverse engineer this image into a generative prompt.';

    const response = await client.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }
    }

    if (parsed && typeof parsed.prompt === 'string') {
      return {
        prompt: parsed.prompt,
        negativePrompt: parsed.negativePrompt || 'blurry, low quality, artifacts, distorted anatomy',
        style: parsed.style || 'Digital Photography',
        composition: parsed.composition || 'Medium shot',
        lighting: parsed.lighting || 'Natural lighting',
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
        model
      };
    }

    return {
      prompt: text.trim(),
      negativePrompt: 'blurry, low quality, artifacts',
      style: 'General',
      composition: 'Standard',
      lighting: 'Ambient',
      subjects: [],
      model
    };
  }

  public async analyzeUI(params: AIUIAnalyzeParams): Promise<AIUIAnalyzeResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const imagePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBuffer.toString('base64')
      }
    };

    const systemInstruction = `You are a principal UI/UX designer and software architect.
Analyze the provided UI screenshot or mockup and extract a structured UI design specification in strictly valid JSON:
{
  "pageType": "Dashboard / Landing Page / E-commerce Product Page / Mobile App Screen / Settings Modal / etc.",
  "layout": "Grid / Flexbox / Sidebar + Header + Main layout / Split screen / etc.",
  "sections": ["Header navigation with logo and links", "Hero section with CTA", "Metrics cards grid", "Data table", "Footer"],
  "components": ["Search bar", "Primary button", "User avatar dropdown", "Data card with badge", "Filter tabs"],
  "typography": "Heading hierarchy (e.g. Bold sans-serif H1 ~32px, H2 ~24px, muted secondary body text ~14px)",
  "colors": ["#1E293B (Dark slate background)", "#0EA5E9 (Sky blue accent)", "#FFFFFF (Text primary)"],
  "spacing": "Spacing system assessment (e.g., 8px base grid, compact 16px card padding, 24px section margins)",
  "responsiveBehavior": "Inferred responsive clues (e.g., collapsible sidebar on mobile, 4-column cards collapsing to 1-column)",
  "observations": ["Directly observed UI element 1", "Directly observed UI element 2"],
  "inferences": ["Plausible interaction state inference 1", "Plausible UI flow inference 2"]
}
CRITICAL RULES:
- Never claim hidden behavior or backend logic can be known with certainty from a screenshot; label such aspects as inferences.
- Return ONLY valid JSON.`;

    const promptText = params.instruction
      ? `User instruction: ${params.instruction}\n\nAnalyze this UI screenshot thoroughly.`
      : 'Analyze this UI screenshot thoroughly.';

    const response = await client.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }
    }

    if (parsed && (parsed.pageType || parsed.layout)) {
      return {
        pageType: parsed.pageType || 'Web Application Screen',
        layout: parsed.layout || 'Responsive Layout',
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        components: Array.isArray(parsed.components) ? parsed.components : [],
        typography: parsed.typography || 'Sans-serif system typography',
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        spacing: parsed.spacing || 'Modern 8px grid system',
        responsiveBehavior: parsed.responsiveBehavior || 'Standard responsive container',
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        inferences: Array.isArray(parsed.inferences) ? parsed.inferences : [],
        model
      };
    }

    return {
      pageType: 'User Interface',
      layout: 'Grid / Flexbox',
      sections: ['Main Section'],
      components: ['UI Elements'],
      typography: 'Standard UI font',
      colors: [],
      spacing: 'Standard spacing',
      responsiveBehavior: 'Adaptive',
      observations: [text.trim()],
      inferences: [],
      model
    };
  }

  public async screenshotToCode(params: AIScreenshotToCodeParams): Promise<AIScreenshotToCodeResult> {
    const client = this.ensureConfigured();
    const model = params.model || 'gemini-3.8-flash';
    const imagePart = {
      inlineData: {
        mimeType: params.mimeType,
        data: params.imageBuffer.toString('base64')
      }
    };

    const targetFramework = params.framework || 'React';
    const targetLanguage = params.language || 'TypeScript';

    const systemInstruction = `You are a senior frontend engineer.
Convert the provided UI screenshot into clean, modular, production-ready frontend code in strictly valid JSON:
{
  "summary": "Concise summary of the UI components and pages created from the screenshot",
  "framework": "${targetFramework}",
  "language": "${targetLanguage}",
  "files": [
    {
      "path": "src/components/GeneratedScreen.tsx",
      "content": "..."
    }
  ],
  "warnings": ["Any interactive behavior inferred that might need backend integration"]
}
CRITICAL RULES:
- Use React functional components with TypeScript and Tailwind CSS utility classes.
- Write complete, elegant, beautiful components matching the screenshot's layout, colors, typography, and spacing.
- Include a main component (e.g. src/components/GeneratedScreen.tsx or src/App.tsx) and necessary subcomponents.
- File paths MUST be safe relative paths (e.g. src/components/Navbar.tsx).
- NEVER use eval, exec, child_process, Function, or unsafe code.
- Return ONLY valid JSON.`;

    const promptText = params.instruction
      ? `User instruction: ${params.instruction}\n\nGenerate ${targetFramework} + ${targetLanguage} code for this UI screenshot.`
      : `Convert this UI screenshot into ${targetFramework} + ${targetLanguage} code with Tailwind CSS.`;

    const response = await client.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }
    }

    const sanitizePath = (rawPath: string): string => {
      let clean = String(rawPath || 'src/components/GeneratedScreen.tsx')
        .replace(/[\0\x00-\x1F]/g, '')
        .replace(/\\/g, '/')
        .replace(/^[a-zA-Z]:\/?/, '')
        .replace(/\/\.+/g, '/')
        .replace(/\.\.+\//g, '')
        .replace(/^\/+/, '');
      if (!clean || clean.startsWith('.')) {
        clean = 'src/components/GeneratedScreen.tsx';
      }
      return clean;
    };

    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      const safeFiles = parsed.files.map((f: any) => ({
        path: sanitizePath(f.path),
        content: String(f.content || '')
      }));

      return {
        summary: parsed.summary || 'UI screenshot converted to code successfully',
        framework: parsed.framework || targetFramework,
        language: parsed.language || targetLanguage,
        files: safeFiles,
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        model
      };
    }

    // Fallback: extract code blocks if JSON structure was missing
    const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const fallbackCode = codeMatch ? codeMatch[1].trim() : text.trim();

    return {
      summary: 'Generated React component from UI screenshot',
      framework: targetFramework,
      language: targetLanguage,
      files: [
        {
          path: 'src/components/GeneratedScreen.tsx',
          content: fallbackCode
        }
      ],
      warnings: ['Code generated from raw AI output'],
      model
    };
  }

  public async generateSpecification(prompt: string): Promise<ApplicationSpecification> {
    const client = this.ensureConfigured();
    const model = 'gemini-3.8-flash';
    const systemPrompt = `You are a Principal Software Architect and Product Manager.
Transform the user's application idea into a comprehensive, structured Application Specification in JSON format.
Your response MUST be a single valid JSON object with the following structure:
{
  "name": "Application Name",
  "description": "Detailed description",
  "targetPlatforms": ["Web", "Mobile"],
  "users": ["Admin", "User"],
  "roles": [{"name": "Admin", "description": "Full access", "permissions": ["users.manage", "reports.read"]}],
  "modules": [{"name": "Authentication", "description": "User login & registration", "features": ["JWT", "OAuth"]}],
  "entities": [{"name": "User", "description": "System user", "fields": [{"name": "id", "type": "string", "isPrimary": true}, {"name": "email", "type": "string", "required": true, "unique": true}]}],
  "workflows": [{"name": "User Registration", "steps": ["Fill form", "Validate email", "Account active"]}],
  "pages": [{"name": "Dashboard", "path": "/dashboard", "description": "Main dashboard", "module": "Core"}],
  "apis": [{"method": "GET", "path": "/api/users", "description": "List users", "authRequired": true}],
  "integrations": ["Email service"],
  "constraints": ["Secure sessions", "Input sanitization"],
  "assumptions": ["Standard PostgreSQL database"],
  "questions": ["Should we support multi-tenant organizations?"]
}`;

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        name: prompt.slice(0, 30),
        description: prompt,
        targetPlatforms: ['Web'],
        users: ['User'],
        roles: [{ name: 'User', description: 'Standard user', permissions: ['read'] }],
        modules: [{ name: 'Core', description: 'Core module', features: ['Dashboard'] }],
        entities: [{ name: 'Record', description: 'Sample entity', fields: [{ name: 'id', type: 'string', isPrimary: true }] }],
        workflows: [{ name: 'Default', steps: ['Start', 'End'] }],
        pages: [{ name: 'Home', path: '/', description: 'Home page', module: 'Core' }],
        apis: [{ method: 'GET', path: '/api/status', description: 'Status check', authRequired: false }],
        integrations: [],
        constraints: []
      };
    }
  }

  public async generateArchitecture(spec: ApplicationSpecification): Promise<ArchitecturePlan> {
    const client = this.ensureConfigured();
    const model = 'gemini-3.8-flash';
    const systemPrompt = `You are a Cloud Solutions Architect.
Design a robust Architecture Plan for the given Application Specification in JSON format:
{
  "frontend": {"framework": "React 19 + Vite", "styling": "Tailwind CSS", "stateManagement": "React Context"},
  "backend": {"runtime": "Node.js", "framework": "Express + TypeScript", "architecture": "Modular Monolith"},
  "database": {"engine": "PostgreSQL", "ORM": "Drizzle / Raw SQL", "schemaOverview": "Relational schema with normalized tables"},
  "authentication": {"strategy": "JWT / Session Cookies", "tokenType": "Bearer"},
  "authorization": {"model": "RBAC", "rbac": true},
  "storage": {"provider": "S3 Compatible / Local", "strategy": "Secure artifact storage"},
  "apiStructure": "RESTful JSON APIs under /api/",
  "moduleDependencies": [{"module": "Users", "dependsOn": ["Auth"]}],
  "deploymentModel": "Containerized Cloud Service"
}`;

    const response = await client.models.generateContent({
      model,
      contents: JSON.stringify(spec),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        frontend: { framework: 'React', styling: 'Tailwind CSS', stateManagement: 'React State' },
        backend: { runtime: 'Node.js', framework: 'Express', architecture: 'Monolith' },
        database: { engine: 'PostgreSQL', ORM: 'SQL', schemaOverview: 'Standard tables' },
        authentication: { strategy: 'Session', tokenType: 'Cookie' },
        authorization: { model: 'RBAC', rbac: true },
        storage: { provider: 'Local Storage', strategy: 'Filesystem' },
        apiStructure: 'REST API',
        moduleDependencies: [],
        deploymentModel: 'Node Server'
      };
    }
  }

  public async generatePIR(spec: ApplicationSpecification, arch: ArchitecturePlan): Promise<PIRProject> {
    const client = this.ensureConfigured();
    const model = 'gemini-3.8-flash';
    const systemPrompt = `You are a Systems Engineer. Create a canonical Project Intermediate Representation (PIR) JSON from the specification and architecture:
{
  "project": {"name": "...", "description": "...", "version": "1.0.0"},
  "modules": [{"id": "...", "name": "...", "description": "..."}],
  "entities": [{"name": "...", "module": "...", "fields": [{"name": "id", "type": "string", "primaryKey": true}], "relations": []}],
  "apis": [{"method": "GET", "path": "...", "module": "...", "auth": true}],
  "pages": [{"name": "...", "path": "...", "module": "...", "components": ["..."]}],
  "components": [{"name": "...", "type": "page", "props": []}],
  "workflows": [{"name": "...", "steps": ["..."]}],
  "roles": [{"name": "...", "permissions": ["..."]}],
  "dependencies": [{"from": "...", "to": "..."}]
}`;

    const response = await client.models.generateContent({
      model,
      contents: JSON.stringify({ specification: spec, architecture: arch }),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        project: { name: spec.name, description: spec.description, version: '1.0.0' },
        modules: [{ id: 'core', name: 'Core', description: 'Core module' }],
        entities: [{ name: 'User', module: 'Core', fields: [{ name: 'id', type: 'string', primaryKey: true }], relations: [] }],
        apis: [{ method: 'GET', path: '/api/health', module: 'Core', auth: false }],
        pages: [{ name: 'Home', path: '/', module: 'Core', components: ['Navbar', 'Hero'] }],
        components: [{ name: 'Navbar', type: 'layout', props: [] }],
        workflows: [{ name: 'Auth', steps: ['Login'] }],
        roles: [{ name: 'Admin', permissions: ['all'] }],
        dependencies: []
      };
    }
  }

  public async validatePIR(pir: PIRProject): Promise<PIRValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pir || !pir.project || !pir.project.name) {
      errors.push('Missing project root or project name in PIR.');
    }

    if (!Array.isArray(pir?.entities) || pir.entities.length === 0) {
      errors.push('PIR must define at least one entity.');
    } else {
      const entityNames = new Set<string>();
      for (const ent of pir.entities) {
        if (!ent.name) {
          errors.push('Entity found with missing name.');
          continue;
        }
        if (entityNames.has(ent.name)) {
          errors.push(`Duplicate entity name detected: "${ent.name}".`);
        }
        entityNames.add(ent.name);

        const fields = ent.fields || [];
        const fieldNames = new Set<string>();
        let hasPrimary = false;
        for (const f of fields) {
          if (!f.name) {
            errors.push(`Entity "${ent.name}" has a field with missing name.`);
            continue;
          }
          if (fieldNames.has(f.name)) {
            errors.push(`Duplicate field name "${f.name}" in entity "${ent.name}".`);
          }
          fieldNames.add(f.name);
          if (f.primaryKey) hasPrimary = true;
        }
        if (!hasPrimary) {
          warnings.push(`Entity "${ent.name}" has no defined primary key field.`);
        }
      }
    }

    // Circular dependency detection in dependencies graph
    const deps = pir.dependencies || [];
    const adj = new Map<string, string[]>();
    for (const d of deps) {
      if (!d.from || !d.to) continue;
      if (!adj.has(d.from)) adj.set(d.from, []);
      adj.get(d.from)!.push(d.to);
    }
    const visited = new Set<string>();
    const recStack = new Set<string>();
    function hasCycle(node: string): boolean {
      visited.add(node);
      recStack.add(node);
      for (const neighbor of (adj.get(node) || [])) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      recStack.delete(node);
      return false;
    }
    for (const node of adj.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          errors.push(`Circular dependency detected in graph involving "${node}".`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  public async generateArtifacts(pir: PIRProject): Promise<AppBuilderArtifacts> {
    const client = this.ensureConfigured();
    const model = 'gemini-3.8-flash';
    const systemPrompt = `You are a Full-Stack Code Generator. Generate production-ready artifacts for the given PIR in JSON format:
{
  "databaseSchemaSQL": "CREATE TABLE users (...);",
  "backendFiles": [{"path": "src/server.ts", "content": "..."}],
  "frontendFiles": [{"path": "src/App.tsx", "content": "..."}],
  "apiContracts": [{"method": "GET", "path": "/api/users", "requestSample": {}, "responseSample": {}}],
  "rbacMatrix": [{"role": "Admin", "permissions": ["users.read"]}]
}`;

    const response = await client.models.generateContent({
      model,
      contents: JSON.stringify(pir),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {
        databaseSchemaSQL: 'CREATE TABLE app_records (id VARCHAR(64) PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW());',
        backendFiles: [{ path: 'src/server.ts', content: '// Express server stub' }],
        frontendFiles: [{ path: 'src/App.tsx', content: 'export default function App() { return <div>Generated App</div>; }' }],
        apiContracts: [{ method: 'GET', path: '/api/status', requestSample: {}, responseSample: { status: 'ok' } }],
        rbacMatrix: [{ role: 'Admin', permissions: ['*'] }]
      };
    }
  }
}
