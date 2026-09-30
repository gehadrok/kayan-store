import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { AIDocument } from '../../types.ts';
import {
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  ArrowRight,
  Download,
  Sparkles,
  Send,
  HelpCircle,
  BarChart3,
  ListOrdered,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Table,
  Check,
  FileQuestion,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

interface AIDocumentDetailPageProps {
  documentId: string;
  onNavigate?: (path: string) => void;
}

export const AIDocumentDetailPage: React.FC<AIDocumentDetailPageProps> = ({ documentId, onNavigate }) => {
  const { user } = useUserAuth();

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const [document, setDocument] = useState<AIDocument | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analyze' | 'ask' | 'summarize'>('overview');

  // Analysis State
  const [analysisMode, setAnalysisMode] = useState<string>('general');
  const [analysisInstruction, setAnalysisInstruction] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Ask State
  const [question, setQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string; time: string; status: string }>>([]);
  const [askError, setAskError] = useState<string | null>(null);

  // Summarize State
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{ summary: string; keyPoints: string[] } | null>(null);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Sheet selector for Excel
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      handleNav('/login');
      return;
    }
    fetchDocumentDetails();
  }, [user, documentId]);

  const fetchDocumentDetails = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/documents/${documentId}`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocument(data.document);
        setPreview(data.preview);
      } else {
        alert(data.message || 'فشل في تحميل بيانات المستند');
        handleNav('/ai/documents');
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!document) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/documents/${document.id}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instruction: analysisInstruction,
          mode: analysisMode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAnalysisError(data.message || data.error || 'فشل تحليل المستند');
      } else {
        setAnalysisResult(data.analysis);
      }
    } catch (err: any) {
      setAnalysisError('تعذر الاتصال بالخادم لإجراء التحليل');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const qToSend = (customQ || question).trim();
    if (!qToSend || !document) return;

    setIsAsking(true);
    setAskError(null);

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/documents/${document.id}/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: qToSend })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAskError(data.message || data.error || 'فشلت الإجابة على السؤال');
      } else {
        setQaHistory(prev => [
          ...prev,
          {
            question: qToSend,
            answer: data.answer,
            time: new Date().toLocaleTimeString('ar-EG'),
            status: 'completed'
          }
        ]);
        if (!customQ) setQuestion('');
      }
    } catch (err: any) {
      setAskError('تعذر الاتصال بالخادم للإجابة على السؤال');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSummarize = async () => {
    if (!document) return;
    setIsSummarizing(true);
    setSummarizeError(null);

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/documents/${document.id}/summarize`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSummarizeError(data.message || data.error || 'فشل تلخيص المستند');
      } else {
        setSummaryData({
          summary: data.summary,
          keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : []
        });
      }
    } catch (err: any) {
      setSummarizeError('تعذر الاتصال بالخادم لتلخيص المستند');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  if (loading || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-xs">جاري تحميل بيانات المستند...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-300">
      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/ai/documents')}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="العودة إلى قائمة المستندات"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white max-w-xs sm:max-w-md truncate">
                  {document.originalFileName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-semibold uppercase">
                  {document.documentType}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {formatSize(document.sizeBytes)} • تم الرفع {new Date(document.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/ai/documents/${document.id}/download`}
              download
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل الأصل</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-start">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>نظرة عامة ومعاينة</span>
          </button>

          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>التحليل الذكي (Analyze)</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>اسأل المستند (Chat & Ask)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('summarize');
              if (!summaryData) handleSummarize();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'summarize'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>الملخص التنفيذي (Summarize)</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PREVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metadata Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold">نوع المستند</span>
                <p className="text-lg font-black text-white uppercase font-mono">{document.documentType}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold">حجم الملف</span>
                <p className="text-lg font-black text-white font-mono">{formatSize(document.sizeBytes)}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold">حالة المعالجة</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400 font-mono">{document.status}</span>
                </div>
              </div>
            </div>

            {/* Extracted preview based on document type */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-sky-400" />
                  <span>معاينة المحتوى المستخرج من المستند</span>
                </span>
                {preview?.pages && (
                  <span className="text-xs text-slate-400 font-mono">
                    عدد الصفحات: {preview.pages}
                  </span>
                )}
              </h3>

              {/* PDF State: Check if text is extractable */}
              {document.documentType === 'pdf' && preview && !preview.hasText && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>تنبيه: لا يمكن استخراج النص من هذا الملف مباشرة</span>
                  </p>
                  <p className="text-[11px] text-amber-400/80">
                    يبدو أن هذا المستند عبارة عن صور ممسوحة ضوئياً (Scanned PDF) بدون طبقة نصية. لا تتوفر ميزة التعرف الضوئي (OCR) في هذا الإصدار.
                  </p>
                </div>
              )}

              {/* Spreadsheet Sheets Preview */}
              {preview?.sheets && preview.sheets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {preview.sheets.map((sheet: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSheetIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedSheetIndex === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {sheet.sheetName} ({sheet.rowCount} صف)
                      </button>
                    ))}
                  </div>

                  {preview.sheets[selectedSheetIndex]?.sampleRows && (
                    <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-800">
                      <table className="w-full text-xs text-start border-collapse">
                        <tbody>
                          {preview.sheets[selectedSheetIndex].sampleRows.map((row: any, rIdx: number) => (
                            <tr
                              key={rIdx}
                              className={rIdx === 0 ? 'bg-slate-800 text-white font-bold' : 'border-t border-slate-800/60 hover:bg-slate-800/30'}
                            >
                              {Array.isArray(row) ? (
                                row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="p-2.5 border-r border-slate-800/40 truncate max-w-xs font-mono text-[11px]">
                                    {String(cell ?? '')}
                                  </td>
                                ))
                              ) : (
                                <td className="p-2.5">{JSON.stringify(row)}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Text Sample Preview for PDF/Word/CSV */}
              {preview?.textSample && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">عينة من النص المستخرج:</p>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                    {preview.textSample}
                  </pre>
                </div>
              )}

              {/* Image Preview */}
              {['jpg', 'jpeg', 'png', 'webp'].includes(document.documentType) ? (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                  <img
                    src={document.storageKey}
                    alt={document.originalFileName}
                    className="max-h-80 max-w-full rounded-xl object-contain shadow-md"
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYZE */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-400" />
                  <span>التحليل الذكي للمستند</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  اختر نمط التحليل المطلوب واكتب أية تعليمات إضافية لتوجيه محرك Kayan AI.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'general', label: 'تحليل عام', icon: FileText },
                  { id: 'summary', label: 'ملخص شامل', icon: Sparkles },
                  { id: 'key_points', label: 'النقاط الجوهرية', icon: ListOrdered },
                  { id: 'structured_data', label: 'استخراج بيانات', icon: Table },
                  { id: 'financial_analysis', label: 'تحليل مالي وإحصائي', icon: BarChart3 },
                  { id: 'comparison', label: 'مقارنة وتدقيق', icon: Layers }
                ].map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setAnalysisMode(mode.id)}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer ${
                        analysisMode === mode.id
                          ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-400" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Disclaimer for Financial/Legal */}
              {analysisMode === 'financial_analysis' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    تنويه: التحليل المالي المستخرج هو لأغراض استرشادية ومعلوماتية فقط ولا يُعد مشورة استثمارية أو مالية معتمدة.
                  </span>
                </div>
              )}

              {/* Custom Instruction Box */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold">تعليمات إضافية (اختياري):</label>
                <textarea
                  value={analysisInstruction}
                  onChange={(e) => setAnalysisInstruction(e.target.value)}
                  placeholder="مثال: ركز على مؤشرات الأداء، أو استخرج بنود الاتفاقية، أو استخلص الأرقام والتواريخ المهمة..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-sky-600/20 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري معالجة وتحليل المستند بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تنفيذ التحليل الآن</span>
                  </>
                )}
              </button>

              {analysisError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Analysis Result Display */}
              {analysisResult && (
                <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>تقرير التحليل المستخرج</span>
                    </span>

                    <button
                      onClick={() => handleCopy(analysisResult)}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ التقرير'}</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ASK THE DOCUMENT */}
        {activeTab === 'ask' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  <span>اسأل المستند (Ask the Document)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  اطرح أي سؤال حول محتوى الملف وسيقوم المساعد الذكي بالإجابة بالاعتماد الحصري على المستند.
                </p>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-500 font-semibold">أسئلة مقترحة سريعة:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'لخص هذا الملف',
                    'ما أهم النقاط؟',
                    'استخرج جميع الأرقام والبيانات المهمة',
                    'ما هي البيانات الرئيسية؟',
                    'ما هي المشكلات أو التناقضات الموجودة؟'
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestion(q);
                        handleAskQuestion(q);
                      }}
                      disabled={isAsking}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="اكتب سؤالك هنا حول هذا المستند..."
                  disabled={isAsking}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  disabled={isAsking || !question.trim()}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer shrink-0"
                >
                  {isAsking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال</span>
                </button>
              </div>

              {askError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{askError}</span>
                </div>
              )}

              {/* Q&A History */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>سجل المحادثة ({qaHistory.length})</span>
                </h4>

                {qaHistory.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 text-xs">
                    لم تطرح أية أسئلة بعد. اختر سؤالاً من الاقتراحات أعلاه أو اكتب سؤالك الخاص.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {qaHistory.map((item, idx) => (
                      <div key={idx} className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold border-b border-slate-900 pb-2">
                          <span className="flex items-center gap-1.5">
                            <FileQuestion className="w-3.5 h-3.5" />
                            <span>س: {item.question}</span>
                          </span>
                          <span className="text-slate-600 font-mono">{item.time}</span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pt-1">
                          {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUMMARIZE */}
        {activeTab === 'summarize' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    <span>الملخص التنفيذي المستخلص</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    تلخيص سريع للمستند يبرز الفكرة العامة والنقاط الرئيسية.
                  </p>
                </div>

                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>إعادة التلخيص</span>
                </button>
              </div>

              {summarizeError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{summarizeError}</span>
                </div>
              )}

              {isSummarizing ? (
                <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                  <span>جاري استخلاص الملخص التنفيذي والنقاط الجوهرية...</span>
                </div>
              ) : summaryData ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Executive Summary Block */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-sky-400 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>الملخص العام</span>
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {summaryData.summary}
                    </p>
                  </div>

                  {/* Key Points Block */}
                  {summaryData.keyPoints.length > 0 && (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <ListOrdered className="w-4 h-4" />
                        <span>أبرز النقاط المستخلصة</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {summaryData.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
