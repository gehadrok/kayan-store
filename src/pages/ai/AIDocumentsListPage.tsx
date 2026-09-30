import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { AIDocument, AIProject } from '../../types.ts';
import {
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  Eye,
  ShieldCheck,
  Folder
} from 'lucide-react';

interface AIDocumentsListPageProps {
  onNavigate?: (path: string) => void;
}

export const AIDocumentsListPage: React.FC<AIDocumentsListPageProps> = ({ onNavigate }) => {
  const { user } = useUserAuth();

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [projects, setProjects] = useState<AIProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!user) {
      handleNav('/login');
      return;
    }
    fetchDocuments();
    fetchProjects();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/documents', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/projects', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedProjectId) {
      formData.append('projectId', selectedProjectId);
    }

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/documents', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.message || data.error || 'فشل رفع المستند');
      } else {
        setUploadSuccess(`تم رفع المستند "${file.name}" بنجاح وجاهز للتحليل`);
        fetchDocuments();
      }
    } catch (err: any) {
      setUploadError('تعذر الاتصال بالخادم لرفع المستند');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستند "${docName}" نهائياً؟`)) {
      return;
    }

    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/documents/${docId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(docs => docs.filter(d => d.id !== docId));
      } else {
        alert(data.message || 'فشل حذف المستند');
      }
    } catch (err) {
      alert('حدث خطأ أثناء محاولة حذف المستند');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getDocIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-400" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-6 h-6 text-sky-400" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return <ImageIcon className="w-6 h-6 text-purple-400" />;
      default:
        return <File className="w-6 h-6 text-slate-400" />;
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId ? doc.projectId === selectedProjectId : true;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-300">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/ai')}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="العودة إلى استوديو Kayan AI"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white flex items-center gap-2">
                  <span>ذكاء المستندات والملفات</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-semibold">
                    File Intelligence
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/ai')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>الاستوديو التوليدي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-start">
        {/* Banner / Capabilities cards */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>معالجة آمنة للمستندات • حماية الهوية والخصوصية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ارفع مستنداتك وحللها بذكاء Kayan AI
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              قم بفحص واستخراج النصوص والجداول والبيانات من ملفات PDF، Word، Excel، CSV والصور، واطرح الأسئلة المباشرة واستخلص الملخصات والرؤى بدقة وأمان.
            </p>
          </div>

          {/* Supported Format Pills */}
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-800/60 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">📄 PDF (حتى 50MB)</span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">📝 Word .DOCX (حتى 25MB)</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">📊 Excel .XLSX (حتى 25MB)</span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">📋 CSV (حتى 25MB)</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">🖼️ Images (حتى 15MB)</span>
          </div>
        </div>

        {/* Upload Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>رفع مستند جديد</span>
              </h3>
              <p className="text-xs text-slate-400">اختر الملف من جهازك لتحليله بواسطة محرك الذكاء الاصطناعي</p>
            </div>

            {/* Optional Project Assignment */}
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">ربط بمشروع:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">بدون مشروع (عام)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <label className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all text-center group">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {uploading ? <RefreshCw className="w-6 h-6 animate-spin text-sky-400" /> : <Upload className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">
                {uploading ? 'جاري رفع ومعالجة المستند...' : 'انقر هنا لاختيار ملف من جهازك أو اسحبه إلى هنا'}
              </p>
              <p className="text-[11px] text-slate-400">
                PDF, DOCX, XLSX, XLS, CSV, PNG, JPG, WEBP (صيغ .doc القديمة غير مدعومة)
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
            />
          </label>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <span>مستنداتي ({filteredDocs.length})</span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-3 right-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث في المستندات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 w-48 sm:w-64"
                />
              </div>

              <button
                onClick={fetchDocuments}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span>جاري تحميل المستندات...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <p>لا توجد مستندات مرفوعة حتى الآن</p>
              <p className="text-[11px] text-slate-600">ارفع أول ملف PDF أو Word أو جدول بيانات لبدء تحليله فوراً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950/70 border border-slate-800/90 hover:border-sky-500/50 rounded-2xl p-5 space-y-4 transition-all hover:shadow-lg hover:shadow-sky-500/5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {getDocIcon(doc.documentType)}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono uppercase font-bold">
                        {doc.documentType}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4
                        onClick={() => handleNav(`/ai/documents/${doc.id}`)}
                        className="text-xs font-bold text-white hover:text-sky-400 cursor-pointer truncate transition-colors"
                        title={doc.originalFileName}
                      >
                        {doc.originalFileName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{formatSize(doc.sizeBytes)}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleNav(`/ai/documents/${doc.id}`)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة وتحليل</span>
                    </button>

                    <a
                      href={`/api/ai/documents/${doc.id}/download`}
                      download
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
                      title="تحميل الملف الأصلي"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleDelete(doc.id, doc.originalFileName)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20"
                      title="حذف المستند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
