import React, { useState, useRef, useEffect } from 'react';
import type { AIProject, AIJob, AIAsset } from '../../types.ts';
import {
  Eye,
  Sparkles,
  FileCode,
  Layout,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  FolderArchive,
  RefreshCw,
  FileText,
  Palette,
  Layers,
  ShieldCheck,
  ChevronLeft,
  X,
  File,
  Code2,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export type VisualMode = 'analyze' | 'to-prompt' | 'analyze-ui' | 'to-code';

interface VisualIntelligenceStudioProps {
  projects: AIProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  initialMode?: VisualMode;
  onNavigateToComposer?: (prompt: string, capability: 'IMAGE') => void;
  onRefreshJobs?: () => void;
}

export const VisualIntelligenceStudio: React.FC<VisualIntelligenceStudioProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  initialMode = 'analyze',
  onNavigateToComposer,
  onRefreshJobs
}) => {
  const [mode, setMode] = useState<VisualMode>(initialMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [framework, setFramework] = useState('React');
  const [language, setLanguage] = useState('TypeScript');

  // Execution states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Result states
  const [analyzeResult, setAnalyzeResult] = useState<any | null>(null);
  const [promptResult, setPromptResult] = useState<any | null>(null);
  const [uiResult, setUiResult] = useState<any | null>(null);
  const [codeResult, setCodeResult] = useState<{
    summary: string;
    framework: string;
    language: string;
    files: Array<{ path: string; content: string }>;
    warnings: string[];
  } | null>(null);

  // Selected file inside code result
  const [activeCodeFileIndex, setActiveCodeFileIndex] = useState(0);

  // Project visual jobs
  const [visualJobs, setVisualJobs] = useState<AIJob[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchVisualJobs(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchVisualJobs = async (projectId: string) => {
    setIsLoadingHistory(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/projects/${projectId}/jobs`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        const visualTypes = ['vision_analysis', 'image_to_prompt', 'ui_analysis', 'screenshot_to_code'];
        const filtered = data.jobs.filter((j: AIJob) => visualTypes.includes(j.type));
        setVisualJobs(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch visual jobs:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadSingleFile = (file: { path: string; content: string }) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!codeResult || !codeResult.files || codeResult.files.length === 0) return;
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
          projectName: 'kayan-ui-code'
        })
      });
      if (!res.ok) throw new Error('فشل تحميل أرشيف ZIP');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kayan-ui-code.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'فشل في تحميل ملف ZIP');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('يرجى تحديد أو رفع صورة أولاً.');
      return;
    }
    if (!selectedProjectId) {
      setError('يرجى اختيار مشروع لحفظ العملية ضمنه.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append(mode === 'to-code' ? 'screenshot' : 'image', selectedFile);
    formData.append('projectId', selectedProjectId);
    if (instruction.trim()) {
      formData.append('instruction', instruction.trim());
    }

    let endpoint = '/api/ai/vision/analyze';
    if (mode === 'to-prompt') endpoint = '/api/ai/vision/to-prompt';
    if (mode === 'analyze-ui') endpoint = '/api/ai/vision/analyze-ui';
    if (mode === 'to-code') {
      endpoint = '/api/ai/vision/to-code';
      formData.append('framework', framework);
      formData.append('language', language);
    }

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'حدث خطأ غير متوقع أثناء معالجة الطلب.');
      }

      if (mode === 'analyze') {
        setAnalyzeResult(data.result);
      } else if (mode === 'to-prompt') {
        setPromptResult(data.result);
      } else if (mode === 'analyze-ui') {
        setUiResult(data.result);
      } else if (mode === 'to-code') {
        setCodeResult(data.result);
        setActiveCodeFileIndex(0);
      }

      if (selectedProjectId) {
        fetchVisualJobs(selectedProjectId);
      }
      if (onRefreshJobs) {
        onRefreshJobs();
      }
    } catch (err: any) {
      setError(err?.message || 'فشل في الاتصال بمزود الذكاء الاصطناعي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadJobResult = (job: AIJob) => {
    if (!job.result) return;
    if (job.type === 'vision_analysis') {
      setMode('analyze');
      setAnalyzeResult(job.result);
    } else if (job.type === 'image_to_prompt') {
      setMode('to-prompt');
      setPromptResult(job.result);
    } else if (job.type === 'ui_analysis') {
      setMode('analyze-ui');
      setUiResult(job.result);
    } else if (job.type === 'screenshot_to_code') {
      setMode('to-code');
      setCodeResult(job.result as any);
      setActiveCodeFileIndex(0);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCodeFile = codeResult?.files && codeResult.files[activeCodeFileIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Visual Modes Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMode('analyze')}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'analyze'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>تحليل الصور</span>
        </button>

        <button
          onClick={() => setMode('to-prompt')}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'to-prompt'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>صورة إلى توجيه (Prompt)</span>
        </button>

        <button
          onClick={() => setMode('analyze-ui')}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'analyze-ui'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>تحليل واجهة (UI)</span>
        </button>

        <button
          onClick={() => setMode('to-code')}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'to-code'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>لقطة شاشة إلى كود</span>
        </button>
      </div>

      {/* Main Studio Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-sky-400" />
                <span>رفع الصورة أو لقطة الشاشة</span>
              </h3>
              {selectedFile && (
                <button
                  onClick={handleClearImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إزالة</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {!imagePreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-950/60 rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-all hover:bg-slate-950 group"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">انقر للرفع أو اسحب الصورة هنا</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يدعم JPG, JPEG, PNG, WEBP حتى 10 ميجابايت
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-72 flex items-center justify-center group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      تغيير الصورة
                    </button>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            )}

            {/* Target Project Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300">المشروع التابع للعملية</label>
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type || 'GENERAL'})
                  </option>
                ))}
              </select>
            </div>

            {/* Framework & Language (Visible for Screenshot to Code) */}
            {mode === 'to-code' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">إطار العمل (Framework)</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
                  >
                    <option value="React">React (Functional + TS)</option>
                    <option value="React + Vite">React + Vite</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اللغة (Language)</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-sans"
                  >
                    <option value="TypeScript">TypeScript</option>
                    <option value="JavaScript">JavaScript</option>
                  </select>
                </div>
              </div>
            )}

            {/* Optional Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                تعليمات مخصصة (اختياري)
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={
                  mode === 'to-code'
                    ? 'مثال: ركز على القائمة العلوية وأزرار التفاعل واستخدم Tailwind CSS...'
                    : mode === 'to-prompt'
                    ? 'مثال: استخرج تفاصيل الإضاءة وزوايا الكاميرا بدقة...'
                    : mode === 'analyze-ui'
                    ? 'مثال: حلل تسلسل الهرم البصري والمسافات بدقة...'
                    : 'مثال: ركز على تحليل تدرجات الألوان والعناصر الخلفية...'
                }
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 resize-none font-sans"
              />
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">تعذر إكمال العملية</p>
                  <p className="text-[11px] text-rose-300/80">{error}</p>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedFile}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoading || !selectedFile
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : mode === 'to-code'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                  : mode === 'to-prompt'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : mode === 'analyze-ui'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري المعالجة بواسطة الذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {mode === 'to-code'
                      ? 'توليد كود الواجهة (React + TS)'
                      : mode === 'to-prompt'
                      ? 'استخراج التوجيه (Image → Prompt)'
                      : mode === 'analyze-ui'
                      ? 'تحليل مواصفات الواجهة'
                      : 'تحليل الصورة بالذكاء الاصطناعي'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output / Results Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. SCREENSHOT TO CODE RESULT */}
          {mode === 'to-code' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span>الكود البرمجي المولد من لقطة الشاشة</span>
                  </h3>
                  {codeResult && (
                    <p className="text-xs text-slate-400">{codeResult.summary}</p>
                  )}
                </div>

                {codeResult && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadZip}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>تحميل ZIP</span>
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="إعادة التوليد"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {!codeResult ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <FileCode className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                  <p>ارفع لقطة الشاشة وانقر على "توليد كود الواجهة" لمعاينة الكود وملفاته.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Framework & Warnings */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
                      {codeResult.framework}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold">
                      {codeResult.language}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                      {codeResult.files.length} ملفات مولدة
                    </span>
                  </div>

                  {codeResult.warnings && codeResult.warnings.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>ملاحظات وتنبيهات برمجية:</span>
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-amber-300/80 space-y-0.5">
                        {codeResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* File Tree Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 font-mono text-xs">
                    {codeResult.files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCodeFileIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                          activeCodeFileIndex === idx
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <File className="w-3 h-3" />
                        <span>{file.path.split('/').pop()}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active File Code Viewer */}
                  {activeCodeFile && (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">{activeCodeFile.path}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(activeCodeFile.content, 'active_code')}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                            title="نسخ كود الملف"
                          >
                            {copiedKey === 'active_code' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadSingleFile(activeCodeFile)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                            title="تنزيل الملف"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[480px] leading-relaxed select-text" dir="ltr">
                        {activeCodeFile.content}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. IMAGE TO PROMPT RESULT */}
          {mode === 'to-prompt' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>توجيه التوليد المعكوس (Reverse Prompt)</span>
                </h3>
              </div>

              {!promptResult ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <Sparkles className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                  <p>ارفع أي صورة لاستخراج نص توجيه احترافي متوافق مع محركات توليد الصور.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Generated Prompt Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>نص التوجيه الإيجابي (Prompt):</span>
                      <button
                        onClick={() => handleCopy(promptResult.prompt, 'prompt')}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'prompt' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ التوجيه</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 leading-relaxed select-text" dir="ltr">
                      {promptResult.prompt}
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  {promptResult.negativePrompt && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>التوجيه السلبي (Negative Prompt):</span>
                        <button
                          onClick={() => handleCopy(promptResult.negativePrompt, 'neg_prompt')}
                          className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'neg_prompt' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 leading-relaxed select-text" dir="ltr">
                        {promptResult.negativePrompt}
                      </div>
                    </div>
                  )}

                  {/* Extracted Specifications */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">النمط البصري (Style)</span>
                      <p className="text-xs font-bold text-white">{promptResult.style || 'Digital Art'}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">الإضاءة (Lighting)</span>
                      <p className="text-xs font-bold text-white">{promptResult.lighting || 'Natural'}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">التكوين وزاوية اللقطة</span>
                      <p className="text-xs font-bold text-white">{promptResult.composition || 'Medium shot'}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">العناصر الرئيسية</span>
                      <p className="text-xs font-bold text-white">
                        {Array.isArray(promptResult.subjects) ? promptResult.subjects.join('، ') : 'متعدد'}
                      </p>
                    </div>
                  </div>

                  {/* Transfer to Image Generator */}
                  {onNavigateToComposer && (
                    <button
                      onClick={() => onNavigateToComposer(promptResult.prompt, 'IMAGE')}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>استخدام هذا التوجيه في مصمم الصور (Image Studio)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. ANALYZE UI SCREENSHOT RESULT */}
          {mode === 'analyze-ui' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layout className="w-4 h-4 text-indigo-400" />
                  <span>المواصفات الهيكلية والتصميمية للواجهة</span>
                </h3>
              </div>

              {!uiResult ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <Layout className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                  <p>ارفع لقطة شاشة للواجهة لتحليل أقسامها، مكوناتها، ونظام الألوان والخطوط.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">نوع الشاشة</span>
                      <p className="text-xs font-bold text-indigo-300">{uiResult.pageType}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">التخطيط والهيكل</span>
                      <p className="text-xs font-bold text-white">{uiResult.layout}</p>
                    </div>
                  </div>

                  {/* Components Detected */}
                  {Array.isArray(uiResult.components) && uiResult.components.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300">المكونات المرصودة (UI Components):</span>
                      <div className="flex flex-wrap gap-2">
                        {uiResult.components.map((c: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sections Detected */}
                  {Array.isArray(uiResult.sections) && uiResult.sections.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300">أقسام الصفحة (Sections):</span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        {uiResult.sections.map((s: string, idx: number) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Typography & Spacing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">نظام الخطوط (Typography)</span>
                      <p className="text-xs text-slate-300">{uiResult.typography}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">نظام المسافات (Spacing)</span>
                      <p className="text-xs text-slate-300">{uiResult.spacing}</p>
                    </div>
                  </div>

                  {/* Responsive Behavior */}
                  {uiResult.responsiveBehavior && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">مؤشرات التجاوب (Responsive Clues)</span>
                      <p className="text-xs text-slate-300">{uiResult.responsiveBehavior}</p>
                    </div>
                  )}

                  {/* Observed vs Inferred */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ملاحظات مؤكدة بالرؤية (Observed):</span>
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                        {Array.isArray(uiResult.observations) && uiResult.observations.map((o: string, idx: number) => (
                          <li key={idx}>{o}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>استنتاجات سياقية (Inferred):</span>
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                        {Array.isArray(uiResult.inferences) && uiResult.inferences.map((inf: string, idx: number) => (
                          <li key={idx}>{inf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. GENERAL IMAGE ANALYSIS RESULT */}
          {mode === 'analyze' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>نتائج تحليل الصورة بالرؤية الحاسوبية</span>
                </h3>
              </div>

              {!analyzeResult ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <Eye className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                  <p>ارفع أي صورة لتحليل محتواها، عناصرها، وتوزيع إضاءتها وألوانها.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Detailed Description */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-sky-400">الوصف الموضوعي الشامل:</span>
                    <p className="text-xs text-slate-200 leading-relaxed">{analyzeResult.description}</p>
                  </div>

                  {/* Objects and Subjects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300">العناصر المرصودة (Objects):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(analyzeResult.objects) && analyzeResult.objects.map((o: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]"
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300">المواضيع الرئيسية (Subjects):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(analyzeResult.subjects) && analyzeResult.subjects.map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors & Visual Style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-pink-400" />
                        <span>الألوان السائدة:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(analyzeResult.colors) && analyzeResult.colors.map((c: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300">النمط والتكوين:</span>
                      <p className="text-xs text-slate-300">{analyzeResult.visualStyle || 'طبيعي'}</p>
                      <p className="text-[11px] text-slate-400">{analyzeResult.composition}</p>
                    </div>
                  </div>

                  {/* Visible Text */}
                  {analyzeResult.visibleText && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-amber-400">النصوص المقروءة في الصورة:</span>
                      <p className="text-xs font-mono text-slate-200">{analyzeResult.visibleText}</p>
                    </div>
                  )}

                  {/* Observed vs Inferred */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ملاحظات مؤكدة (Observed):</span>
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                        {Array.isArray(analyzeResult.observations) && analyzeResult.observations.map((o: string, idx: number) => (
                          <li key={idx}>{o}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>استنتاجات سياقية (Inferred):</span>
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                        {Array.isArray(analyzeResult.inferences) && analyzeResult.inferences.map((inf: string, idx: number) => (
                          <li key={idx}>{inf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Visual Operations History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">سجل العمليات البصرية للمشروع الحالى</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {visualJobs.length} عملية بصرية مسجلة
          </span>
        </div>

        {visualJobs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            لا توجد عمليات ذكاء بصري سابقة في هذا المشروع بعد.
          </p>
        ) : (
          <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {visualJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      job.type === 'screenshot_to_code'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : job.type === 'image_to_prompt'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : job.type === 'ui_analysis'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {job.type === 'screenshot_to_code' ? (
                      <FileCode className="w-4 h-4" />
                    ) : job.type === 'image_to_prompt' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : job.type === 'ui_analysis' ? (
                      <Layout className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{job.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                      {job.prompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(job.createdAt).toLocaleString('ar-SA')}
                  </span>
                  {job.result && (
                    <button
                      onClick={() => handleLoadJobResult(job)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      عرض النتائج
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
