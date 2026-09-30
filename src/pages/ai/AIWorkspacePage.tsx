import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { AIProject, AIJob, AIAsset } from '../../types.ts';
import {
  Sparkles,
  FolderPlus,
  Send,
  FileCode,
  Image as ImageIcon,
  Video,
  FileText,
  AlertCircle,
  Clock,
  ChevronRight,
  Folder,
  Code2,
  RotateCcw,
  Layers,
  CheckCircle2,
  Wand2,
  History,
  LayoutDashboard,
  ShieldCheck,
  Plus,
  ArrowRight,
  BookOpen,
  Eye,
  Layout
} from 'lucide-react';
import { AIComposer } from '../../components/ai/AIComposer.tsx';
import { AIProjectModal } from '../../components/ai/AIProjectModal.tsx';
import { AIHistoryTable } from '../../components/ai/AIHistoryTable.tsx';
import { AIAssetGallery } from '../../components/ai/AIAssetGallery.tsx';
import { AIPromptLibrary } from '../../components/ai/AIPromptLibrary.tsx';
import { VisualIntelligenceStudio, VisualMode } from '../../components/ai/VisualIntelligenceStudio.tsx';

interface AIWorkspacePageProps {
  onNavigate?: (path: string) => void;
}

export const AIWorkspacePage: React.FC<AIWorkspacePageProps> = ({ onNavigate }) => {
  const { user } = useUserAuth();

  useEffect(() => {
    if (!user) {
      handleNav('/login');
    }
  }, [user]);

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // State
  const [projects, setProjects] = useState<AIProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'visual' | 'history' | 'assets' | 'prompts'>('generate');
  const [visualInitialMode, setVisualInitialMode] = useState<VisualMode>('analyze');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    // Check if URL specifies a project: /ai/projects/:id
    const pathname = window.location.pathname;
    const match = pathname.match(/\/ai\/projects\/([^/]+)/);
    if (match && match[1]) {
      setSelectedProjectId(match[1]);
    }
  }, []);

  // Project Jobs & Assets
  const [projectJobs, setProjectJobs] = useState<AIJob[]>([]);
  const [projectAssets, setProjectAssets] = useState<AIAsset[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Injected Prompt from Library
  const [injectedPrompt, setInjectedPrompt] = useState('');
  const [injectedCapability, setInjectedCapability] = useState<'TEXT' | 'IMAGE' | 'CODE'>('TEXT');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectJobs(selectedProjectId);
      fetchProjectAssets(selectedProjectId);
    }
  }, [selectedProjectId]);

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
        if (data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI projects:', err);
    }
  };

  const fetchProjectJobs = async (projectId: string) => {
    setIsLoadingJobs(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/projects/${projectId}/jobs`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setProjectJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch project jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const fetchProjectAssets = async (projectId: string) => {
    setIsLoadingAssets(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/projects/${projectId}/assets`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setProjectAssets(data.assets);
      }
    } catch (err) {
      console.error('Failed to fetch project assets:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleCreateProject = async (name: string, description: string, type: string): Promise<AIProject | null> => {
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description, type })
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProjects([data.project, ...projects]);
        setSelectedProjectId(data.project.id);
        setActiveTab('generate');
        return data.project;
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
    return null;
  };

  const handleSelectPromptFromLibrary = (promptText: string, capability: 'TEXT' | 'IMAGE' | 'CODE') => {
    setInjectedPrompt(promptText);
    setInjectedCapability(capability);
    setActiveTab('generate');
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-300">
      {/* Studio Navigation Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/products')}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="العودة إلى المتجر"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Kayan AI Studio</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-semibold">
                    V2 Pro
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => handleNav('/login')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تسجيل الدخول لاستخدام Kayan AI
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>مشروع جديد</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متصل بالحساب: {user.displayName || user.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-start">
        {!user && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
              <span>أنت تقوم بمعاينة Kayan AI بوضع الزائر. سجل الدخول لحفظ مشاريعك وأصولك ومتابعة السجل سحابياً.</span>
            </div>
            <button
              onClick={() => handleNav('/login')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 transition-colors cursor-pointer"
            >
              تسجيل الدخول الآن
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Studio Left Sidebar */}
          <div className="space-y-6">
            {/* New Project Button */}
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-sky-600/20 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ إنشاء مشروع جديد</span>
            </button>

            {/* My Projects Panel */}
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-sky-400" />
                  <span>مشاريعي ({projects.length})</span>
                </span>
              </div>

              {projects.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs space-y-2">
                  <p>لا توجد مشاريع مسبقة</p>
                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="text-sky-400 font-bold hover:underline"
                  >
                    أنشئ أول مشروع لك
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const isSelected = selectedProjectId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`w-full text-start p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-500/10'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="truncate space-y-0.5">
                          <span className="block truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal block font-mono">
                            {p.type || 'GENERAL'}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Studio Tabs Navigation */}
            <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 space-y-1 shadow-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'overview' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ملخص المشروع (Overview)</span>
              </button>

              <button
                onClick={() => setActiveTab('generate')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'generate' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Wand2 className="w-4 h-4 text-sky-400" />
                <span>المحرر والتوليد (Composer)</span>
              </button>

              <button
                onClick={() => setActiveTab('visual')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'visual' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4 text-purple-400" />
                <span>الذكاء البصري (Visual AI)</span>
              </button>

              <button
                onClick={() => handleNav('/ai/app-builder')}
                className="w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white hover:from-indigo-600 hover:to-violet-600 font-bold shadow-md shadow-indigo-500/20"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>منشئ التطبيقات (App Builder)</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'history' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>سجل العمليات (History)</span>
              </button>

              <button
                onClick={() => setActiveTab('assets')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'assets' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>الوسائط والأصول (Assets)</span>
              </button>

              <button
                onClick={() => setActiveTab('prompts')}
                className={`w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'prompts' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>مكتبة التوجيهات (Prompts)</span>
              </button>

              <button
                onClick={() => handleNav('/ai/documents')}
                className="w-full text-start px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-colors cursor-pointer bg-gradient-to-r from-sky-950/60 to-indigo-950/40 text-sky-400 hover:text-sky-300 border border-sky-500/20 font-bold"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>ذكاء المستندات (Documents)</span>
              </button>
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Project Banner Header */}
            {activeProject ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{activeProject.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-semibold uppercase">
                      {activeProject.type || 'GENERAL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeProject.description || 'لا يوجد وصف محدد للمشروع.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>مزامنة سحابية آمنة</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                يرجى اختيار مشروع أو إنشاء مشروع جديد لبدء العمل في استوديو Kayan AI.
              </div>
            )}

            {/* TAB CONTENT RENDER */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>إجمالي العمليات والمهام:</span>
                      <History className="w-4 h-4 text-sky-400" />
                    </div>
                    <p className="text-2xl font-black text-white font-mono">{projectJobs.length}</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>إجمالي الوسائط والأصول:</span>
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-white font-mono">{projectAssets.length}</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>حالة الاستوديو:</span>
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                    </div>
                    <p className="text-sm font-bold text-emerald-400">نشط وجاهز للتوليد</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-sky-400" />
                    <span>ماذا تريد أن تنشئ في هذا المشروع؟</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setInjectedCapability('TEXT');
                        setActiveTab('generate');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <FileText className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white">توليد النصوص والتحليل</h4>
                      <p className="text-[11px] text-slate-400">كتابة مقالات، ملخصات، ونصوص تقنية معتمدة</p>
                    </button>

                    <button
                      onClick={() => {
                        setInjectedCapability('IMAGE');
                        setActiveTab('generate');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <ImageIcon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white">توليد الصور والشعارات</h4>
                      <p className="text-[11px] text-slate-400">تصميم أيقونات، شعارات، وواجهات بأبعاد متعددة</p>
                    </button>

                    <button
                      onClick={() => {
                        setInjectedCapability('CODE');
                        setActiveTab('generate');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <Code2 className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white">توليد البرمجيات والكود</h4>
                      <p className="text-[11px] text-slate-400">إنشاء مكونات React وملفات مع تحزيم ZIP</p>
                    </button>
                  </div>
                </div>

                {/* File Intelligence Capability Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>ذكاء المستندات والملفات (File Intelligence)</span>
                    </h3>
                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>استعراض جميع المستندات</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <span className="text-2xl block group-hover:scale-110 transition-transform">📄</span>
                      <h4 className="text-xs font-bold text-white">تحليل PDF</h4>
                      <p className="text-[10px] text-slate-400 font-mono">حتى 50 MB</p>
                    </button>

                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <span className="text-2xl block group-hover:scale-110 transition-transform">📝</span>
                      <h4 className="text-xs font-bold text-white">تحليل Word</h4>
                      <p className="text-[10px] text-slate-400 font-mono">ملفات DOCX</p>
                    </button>

                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <span className="text-2xl block group-hover:scale-110 transition-transform">📊</span>
                      <h4 className="text-xs font-bold text-white">تحليل Excel</h4>
                      <p className="text-[10px] text-slate-400 font-mono">جداول ومصنفات</p>
                    </button>

                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-start space-y-2 transition-all cursor-pointer group"
                    >
                      <span className="text-2xl block group-hover:scale-110 transition-transform">📋</span>
                      <h4 className="text-xs font-bold text-white">تحليل CSV</h4>
                      <p className="text-[10px] text-slate-400 font-mono">بيانات مهيكلة</p>
                    </button>

                    <button
                      onClick={() => handleNav('/ai/documents')}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-start space-y-2 transition-all cursor-pointer group col-span-2 sm:col-span-1"
                    >
                      <span className="text-2xl block group-hover:scale-110 transition-transform">🖼️</span>
                      <h4 className="text-xs font-bold text-white">تحليل الصور</h4>
                      <p className="text-[10px] text-slate-400 font-mono">رؤية حاسوبية</p>
                    </button>
                  </div>
                </div>

                {/* Visual Intelligence Section (Requirement 9 & 10) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span>الذكاء البصري وعكس النماذج (Visual Intelligence & Reverse AI)</span>
                    </h3>
                    <button
                      onClick={() => {
                        setVisualInitialMode('analyze');
                        setActiveTab('visual');
                      }}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>فتح استوديو الذكاء البصري</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => {
                        setVisualInitialMode('analyze');
                        setActiveTab('visual');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-start space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">تحليل الصور (Analyze Image)</h4>
                      <p className="text-[11px] text-slate-400">استخراج العناصر، الإضاءة، الألوان، والأوصاف الموضوعية</p>
                    </button>

                    <button
                      onClick={() => {
                        setVisualInitialMode('to-prompt');
                        setActiveTab('visual');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-start space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">صورة إلى توجيه (Image → Prompt)</h4>
                      <p className="text-[11px] text-slate-400">عكس الصور إلى أوامر توليد دقيقة مع التوجيه السلبي</p>
                    </button>

                    <button
                      onClick={() => {
                        setVisualInitialMode('analyze-ui');
                        setActiveTab('visual');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-start space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Layout className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">تحليل واجهة (Analyze UI)</h4>
                      <p className="text-[11px] text-slate-400">تفكيك هيكل الشاشة، المكونات، المسافات ونظام الخطوط</p>
                    </button>

                    <button
                      onClick={() => {
                        setVisualInitialMode('to-code');
                        setActiveTab('visual');
                      }}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-start space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">واجهة إلى كود (Screenshot → Code)</h4>
                      <p className="text-[11px] text-slate-400">تحويل لقطة الشاشة إلى كود React + TS وتنزيل ZIP</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. GENERATE COMPOSER TAB */}
            {activeTab === 'generate' && (
              <div className="animate-in fade-in duration-200">
                <AIComposer
                  activeProject={activeProject}
                  projects={projects}
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  onOpenPromptLibrary={() => setActiveTab('prompts')}
                  initialPrompt={injectedPrompt}
                  initialCapability={injectedCapability}
                />
              </div>
            )}

            {/* 2.5 VISUAL INTELLIGENCE STUDIO TAB */}
            {activeTab === 'visual' && (
              <div className="animate-in fade-in duration-200">
                <VisualIntelligenceStudio
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={(pId) => setSelectedProjectId(pId)}
                  initialMode={visualInitialMode}
                  onNavigateToComposer={(prompt) => {
                    setInjectedPrompt(prompt);
                    setInjectedCapability('IMAGE');
                    setActiveTab('generate');
                  }}
                  onRefreshJobs={() => {
                    if (selectedProjectId) {
                      fetchProjectJobs(selectedProjectId);
                      fetchProjectAssets(selectedProjectId);
                    }
                  }}
                />
              </div>
            )}

            {/* 3. HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-200">
                <AIHistoryTable jobs={projectJobs} isLoading={isLoadingJobs} />
              </div>
            )}

            {/* 4. ASSETS TAB */}
            {activeTab === 'assets' && (
              <div className="animate-in fade-in duration-200">
                <AIAssetGallery assets={projectAssets} isLoading={isLoadingAssets} />
              </div>
            )}

            {/* 5. PROMPTS LIBRARY TAB */}
            {activeTab === 'prompts' && (
              <div className="animate-in fade-in duration-200">
                <AIPromptLibrary onSelectPrompt={handleSelectPromptFromLibrary} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Creation Modal */}
      <AIProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};
