import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Code2,
  Video,
  Send,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  FolderArchive,
  FileCode,
  AlertCircle,
  Clock,
  ChevronRight,
  Layers,
  Wand2
} from 'lucide-react';
import { AIJobStatus } from './AIJobStatus.tsx';
import type { AIProject, AIJob } from '../../types.ts';

export function formatRetryDelay(secondsInput: number | string): string {
  const totalSec = Math.round(Number(secondsInput) || 0);
  if (totalSec <= 0) {
    return "يرجى المحاولة مرة أخرى بعد قليل.";
  }
  if (totalSec < 60) {
    return `يرجى المحاولة مرة أخرى بعد ${totalSec} ثانية.`;
  }
  if (totalSec < 3600) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const minWord = mins === 1 ? "دقيقة" : mins === 2 ? "دقيقتين" : `${mins} دقائق`;
    const secWord = secs > 0 ? ` و ${secs} ثانية` : "";
    return `يرجى المحاولة مرة أخرى بعد ${minWord}${secWord}.`;
  }
  return "يرجى المحاولة مرة أخرى لاحقًا.";
}

interface AIComposerProps {
  activeProject?: AIProject | null;
  projects?: AIProject[];
  onSelectProject?: (project: AIProject) => void;
  onOpenPromptLibrary?: () => void;
  initialPrompt?: string;
  initialCapability?: 'TEXT' | 'IMAGE' | 'CODE';
}

export const AIComposer: React.FC<AIComposerProps> = ({
  activeProject,
  projects = [],
  onSelectProject,
  onOpenPromptLibrary,
  initialPrompt = '',
  initialCapability = 'TEXT'
}) => {
  const [capability, setCapability] = useState<'TEXT' | 'IMAGE' | 'CODE' | 'VIDEO'>(initialCapability);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState<string>(
    initialCapability === 'IMAGE'
      ? 'gemini-3.1-flash-image'
      : initialCapability === 'CODE'
      ? 'gemini-3.1-pro-preview'
      : 'gemini-3.8-flash'
  );
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [language, setLanguage] = useState<string>('TypeScript');
  const [framework, setFramework] = useState<string>('React');

  // Execution states
  const [status, setStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Results
  const [textResult, setTextResult] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<{ url: string; sha256?: string; sizeBytes?: number } | null>(null);
  const [codeResult, setCodeResult] = useState<{
    summary: string;
    language: string;
    framework?: string;
    files: Array<{ path: string; content: string }>;
    warnings: string[];
  } | null>(null);

  // UI state for code view
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Update default model when capability changes
  const handleCapabilityChange = (cap: 'TEXT' | 'IMAGE' | 'CODE' | 'VIDEO') => {
    setCapability(cap);
    if (cap === 'TEXT') setModel('gemini-3.8-flash');
    if (cap === 'IMAGE') setModel('gemini-3.1-flash-image');
    if (cap === 'CODE') setModel('gemini-3.1-pro-preview');
  };

  const handleCopyText = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(idKey);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleDownloadTxt = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!codeResult || !codeResult.files || codeResult.files.length === 0) return;
    setIsZipping(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const res = await fetch('/api/ai/download-zip', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          files: codeResult.files,
          projectName: activeProject?.name || 'kayan_ai_generated_code'
        })
      });

      if (!res.ok) {
        throw new Error('فشل في تحزيم ملفات الكود في أرشيف ZIP');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(activeProject?.name || 'kayan_ai_code').replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء تنزيل أسطوانة الكود ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setStatus('queued');
    setErrorMsg(null);
    setTextResult(null);
    setImageResult(null);
    setCodeResult(null);

    const payload: any = {
      projectId: activeProject?.id,
      prompt: prompt.trim(),
      model
    };

    try {
      let endpoint = '/api/ai/generate/text';
      if (capability === 'IMAGE') {
        endpoint = '/api/ai/generate/image';
        payload.aspectRatio = aspectRatio;
      } else if (capability === 'CODE') {
        endpoint = '/api/ai/generate/code';
        payload.language = language;
        payload.framework = framework;
      }

      setStatus('processing');

      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus('failed');
        const errType = data.error || '';
        const rawMessage = data.message || '';

        if (res.status === 401) {
          setErrorMsg('يجب تسجيل الدخول لاستخدام خدمات Kayan AI');
          return;
        }
        if (res.status === 403) {
          setErrorMsg('غير مصرح لك بالوصول أو التوليد على هذا المشروع');
          return;
        }
        if (res.status === 429 || errType === 'AI_RATE_LIMITED' || errType === 'AI_QUOTA_EXCEEDED' || rawMessage.includes('Limit') || rawMessage.includes('Quota')) {
          setErrorMsg("تم تجاوز حد استخدام خدمة الذكاء الاصطناعي حاليًا. يرجى المحاولة مرة أخرى لاحقًا.");
          return;
        }
        if (res.status === 503 || errType === 'AI_PROVIDER_UNAVAILABLE') {
          setErrorMsg("خدمة الذكاء الاصطناعي غير متاحة حاليًا. يرجى المحاولة لاحقًا.");
          return;
        }
        if (errType === 'AI_PROVIDER_NOT_CONFIGURED') {
          setErrorMsg("مزود الذكاء الاصطناعي غير مهيأ حاليًا.");
          return;
        }

        setErrorMsg(rawMessage || 'حدث خطأ أثناء معالجة الطلب');
        return;
      }

      setStatus('completed');
      setJobId(data.jobId || data.job?.id);

      if (capability === 'TEXT') {
        setTextResult(data.result?.text || data.result || 'تم توليد النص بنجاح');
      } else if (capability === 'IMAGE') {
        setImageResult({
          url: data.result?.imageUrl || data.result,
          sha256: data.result?.sha256,
          sizeBytes: data.result?.sizeBytes
        });
      } else if (capability === 'CODE') {
        setCodeResult(data.result);
        setSelectedFileIdx(0);
      }
    } catch (err: any) {
      setStatus('failed');
      const rawMessage = err?.message || '';
      if (rawMessage.includes('429') || rawMessage.includes('Quota') || rawMessage.includes('Limit')) {
        setErrorMsg("تم تجاوز حد استخدام خدمة الذكاء الاصطناعي حاليًا. يرجى المحاولة مرة أخرى لاحقًا.");
      } else if (rawMessage.includes('503') || rawMessage.includes('unavailable') || rawMessage.includes('busy')) {
        setErrorMsg("خدمة الذكاء الاصطناعي غير متاحة حاليًا. يرجى المحاولة لاحقًا.");
      } else {
        setErrorMsg(rawMessage || 'تعذر الاتصال بـ Kayan AI Gateway. تحقق من شبكة الاتصال.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Capability Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => handleCapabilityChange('TEXT')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              capability === 'TEXT'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>نص</span>
          </button>

          <button
            onClick={() => handleCapabilityChange('IMAGE')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              capability === 'IMAGE'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>صورة</span>
          </button>

          <button
            onClick={() => handleCapabilityChange('CODE')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              capability === 'CODE'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>كود وبرمجة</span>
          </button>

          <button
            onClick={() => handleCapabilityChange('VIDEO')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60 bg-slate-950 text-slate-500 border border-slate-800/80`}
            title="فيديو (قريباً في المرحلة القادمة)"
          >
            <Video className="w-4 h-4 text-slate-500" />
            <span>فيديو</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              قريباً
            </span>
          </button>
        </div>

        {/* Project Context & Prompt Library Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {onOpenPromptLibrary && (
            <button
              onClick={onOpenPromptLibrary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-sky-400" />
              <span>مكتبة التوجيهات</span>
            </button>
          )}

          {projects.length > 0 && onSelectProject && (
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const p = projects.find(proj => proj.id === e.target.value);
                if (p) onSelectProject(p);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="" disabled>اختر المشروع...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Composer Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
        {/* Configuration Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>النموذج المستخدم:</span>
            </span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sky-300 font-mono text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {capability === 'TEXT' && (
                <>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (افتراضي)</option>
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (سريع / خفيف)</option>
                </>
              )}
              {capability === 'IMAGE' && (
                <>
                  <option value="gemini-3.1-flash-image">gemini-3.1-flash-image (دقة عالية)</option>
                  <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image (سريع)</option>
                </>
              )}
              {capability === 'CODE' && (
                <>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (ذكي / مطور)</option>
                </>
              )}
            </select>
          </div>

          {/* Capability Specific Selectors */}
          {capability === 'IMAGE' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">أبعاد الصورة:</span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
              >
                <option value="1:1">1:1 (مربع)</option>
                <option value="16:9">16:9 (عريض)</option>
                <option value="9:16">9:16 (عمودي / ستوري)</option>
                <option value="4:3">4:3 (شاشة قياسية)</option>
                <option value="3:4">3:4 (عمودي قياسي)</option>
              </select>
            </div>
          )}

          {capability === 'CODE' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
              >
                <option value="TypeScript">TypeScript</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="HTML/CSS">HTML/CSS</option>
                <option value="SQL">SQL</option>
              </select>

              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
              >
                <option value="React">React</option>
                <option value="Tailwind CSS">Tailwind CSS</option>
                <option value="Express/Node.js">Express / Node.js</option>
                <option value="Next.js">Next.js</option>
                <option value="Vanilla">بدون إطار (Vanilla)</option>
              </select>
            </div>
          )}
        </div>

        {/* Video Coming Soon Banner */}
        {capability === 'VIDEO' ? (
          <div className="p-8 text-center space-y-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <Video className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">توليد الفيديو غير متاح حالياً في هذه المرحلة</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يجري تجهيز محرك Veo 3.1 لتوليد مقاطع الفيديو بدقة 1080p وسيتم إطلاقه رسمياً في المرحلة القادمة.
            </p>
          </div>
        ) : (
          <>
            {/* Textarea Prompt Editor */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  capability === 'TEXT'
                    ? 'اكتب الموضوع أو المقال أو الملخص الذي تريد توليده بالذكاء الاصطناعي...'
                    : capability === 'IMAGE'
                    ? 'اكتب وصفاً تفصيلياً للصورة أو الشعار المطلوب توليده...'
                    : 'اكتب الوصف البرمجي أو المكون المطلوبة كتابته بلغة TypeScript/React...'
                }
                rows={4}
                maxLength={10000}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none leading-relaxed font-sans"
              />

              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span>{prompt.length} / 10,000</span>
                {prompt.length > 0 && (
                  <button
                    onClick={() => setPrompt('')}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="مسح النص"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {status !== 'failed' && <AIJobStatus status={status} />}
              </div>

              <div className="flex items-center gap-2.5">
                {status === 'failed' && (
                  <button
                    onClick={handleExecute}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-amber-600/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة المحاولة</span>
                  </button>
                )}

                <button
                  onClick={handleExecute}
                  disabled={status === 'processing' || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{status === 'processing' ? 'جاري المعالجة...' : 'إنشاء بالذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error Unified Banner */}
      {status === 'failed' && errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Structured Output Panels */}

      {/* 1. TEXT RESULT PANEL */}
      {textResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sky-400 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span>نتيجة النص المتولدة:</span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(textResult, 'text_res')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedState === 'text_res' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedState === 'text_res' ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>

              <button
                onClick={() => handleDownloadTxt(textResult, 'kayan_ai_text.txt')}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل TXT</span>
              </button>
            </div>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-200 text-xs bg-slate-950 p-5 rounded-2xl border border-slate-800/80 max-h-[500px] overflow-y-auto">
            {textResult}
          </div>
        </div>
      )}

      {/* 2. IMAGE RESULT PANEL */}
      {imageResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sky-400 flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4" />
              <span>الصورة المتولدة بنجاح:</span>
            </h4>

            <div className="flex items-center gap-2">
              <a
                href={imageResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>عرض بالحجم الكامل</span>
              </a>

              <a
                href={imageResult.url}
                download="kayan_ai_generated_image.png"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل الصورة</span>
              </a>
            </div>
          </div>

          <div className="flex justify-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <img
              src={imageResult.url}
              alt="AI Generated"
              className="max-h-96 rounded-xl object-contain shadow-2xl"
            />
          </div>

          {imageResult.sha256 && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>SHA-256: {imageResult.sha256}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. CODE RESULT PANEL */}
      {codeResult && codeResult.files && codeResult.files.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sky-400 text-xs">{codeResult.summary}</span>
              <span className="rounded bg-sky-900/60 px-2 py-0.5 text-[10px] font-mono text-sky-200">
                {codeResult.language || 'TypeScript'}
              </span>
              {codeResult.framework && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  {codeResult.framework}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>{isZipping ? 'جاري التحزيم...' : 'تنزيل كود ZIP'}</span>
              </button>

              <button
                onClick={() => handleCopyText(codeResult.files[selectedFileIdx]?.content || '', 'code_file')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedState === 'code_file' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedState === 'code_file' ? 'تم النسخ' : 'نسخ الملف الحاضر'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[350px]">
            {/* File Tree Panel */}
            <div className="p-3 bg-slate-950/60 border-e border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                شجرة الملفات ({codeResult.files.length}):
              </span>
              {codeResult.files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full text-start px-3 py-2 rounded-xl text-[11px] font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                    selectedFileIdx === idx
                      ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>

            {/* Code Viewer Panel */}
            <div className="md:col-span-3 p-4 bg-slate-900 font-mono text-[11px] overflow-x-auto leading-relaxed">
              <div className="text-slate-400 text-[10px] mb-2 pb-1 border-b border-slate-800 flex justify-between">
                <span>{codeResult.files[selectedFileIdx]?.path}</span>
                <span>{codeResult.files[selectedFileIdx]?.content.length} أحرف</span>
              </div>
              <pre className="text-slate-200 whitespace-pre leading-relaxed">
                {codeResult.files[selectedFileIdx]?.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
