import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { AIProject } from '../../types.ts';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  FileCode,
  Database,
  ShieldCheck,
  Download,
  ArrowRight,
  Plus,
  RefreshCw,
  FolderPlus,
  Check,
  AlertTriangle,
  XCircle,
  Code2,
  Server,
  Cpu,
  Globe,
  Terminal,
  FileText,
  Play,
  Square,
  Lock,
  Package,
  Cpu as CpuIcon
} from 'lucide-react';

interface AppBuilderPageProps {
  onNavigate?: (path: string) => void;
}

export const AppBuilderPage: React.FC<AppBuilderPageProps> = ({ onNavigate }) => {
  const { user } = useUserAuth();
  const [projects, setProjects] = useState<AIProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AIProject | null>(null);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'spec' | 'arch' | 'pir' | 'artifacts' | 'database' | 'backend' | 'frontend' | 'preview' | 'export' | 'build'>('spec');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Preview state
  const [previewArtifact, setPreviewArtifact] = useState<any>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Export state
  const [buildManifest, setBuildManifest] = useState<any>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);

  // Build orchestration state
  const [buildsList, setBuildsList] = useState<any[]>([]);
  const [targetPlatform, setTargetPlatform] = useState<'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP'>('WEB');
  const [isSubmittingBuild, setIsSubmittingBuild] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      handleNav('/login');
    } else {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (currentProject && activeTab === 'export') {
      fetchExportManifest(currentProject.id);
    }
    if (currentProject && activeTab === 'build') {
      fetchBuilds(currentProject.id);
    }
  }, [currentProject, activeTab]);

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const fetchProjects = async () => {
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/app-builder/projects', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        if (data.projects.length > 0 && !currentProject) {
          setCurrentProject(data.projects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch App Builder projects:', err);
    }
  };

  const fetchExportManifest = async (projectId: string) => {
    setIsLoadingManifest(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/app-builder/projects/${projectId}/export-manifest`, { headers });
      const data = await res.json();
      if (data.success) {
        setBuildManifest(data.manifest);
      } else {
        setBuildManifest(null);
      }
    } catch (err) {
      console.error('Failed to fetch export manifest:', err);
    } finally {
      setIsLoadingManifest(false);
    }
  };

  const fetchBuilds = async (projectId: string) => {
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/app-builder/projects/${projectId}/builds`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.builds)) {
        setBuildsList(data.builds);
      }
    } catch (err) {
      console.error('Failed to fetch builds:', err);
    }
  };

  const handleGenerateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/ai/app-builder/idea', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: ideaPrompt, name: projectName })
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProjects(prev => [data.project, ...prev]);
        setCurrentProject(data.project);
        setIdeaPrompt('');
        setProjectName('');
        setActiveTab('spec');
      } else {
        alert(data.error || 'Failed to generate application specification.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error during specification generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndBuild = async () => {
    if (!currentProject) return;

    setIsApproving(true);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/app-builder/projects/${currentProject.id}/approve`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success && data.project) {
        setCurrentProject(data.project);
        setValidationResult(data.validation);
        setActiveTab('arch');
      } else {
        alert(data.error || 'Failed to generate architecture and artifacts.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error during approval pipeline.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadZip = () => {
    if (!currentProject) return;
    window.open(`/api/ai/app-builder/projects/${currentProject.id}/export`, '_blank');
  };

  const handleSubmitBuild = async () => {
    if (!currentProject) return;
    setIsSubmittingBuild(true);
    setBuildError(null);
    try {
      const userToken = localStorage.getItem('kayan_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      const res = await fetch(`/api/ai/app-builder/projects/${currentProject.id}/build`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetPlatform })
      });
      const data = await res.json();
      if (data.success && data.buildJob) {
        setBuildsList(prev => [data.buildJob, ...prev]);
      } else {
        if (data.error === 'EXTERNAL_BUILDER_NOT_CONFIGURED') {
          setBuildError('EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة البناء الخارجية غير مهيأة حاليًا.');
        } else {
          setBuildError(data.error || data.message || 'Build submission failed.');
        }
      }
    } catch (err: any) {
      setBuildError(err.message || 'Failed to submit external build.');
    } finally {
      setIsSubmittingBuild(false);
    }
  };

  const spec = currentProject?.specification;
  const arch = currentProject?.architecture;
  const pir = currentProject?.pir;
  const artifacts = currentProject?.generatedArtifacts;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>KAYAN AI APP BUILDER — PHASE 9 (EXTERNAL BUILD ORCHESTRATION)</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              External Build Orchestration Foundation
            </h1>
            <p className="text-slate-400 mt-1">
              Orchestrate secure, isolated builds across external build environments while Kayan Store acts as the secure control plane.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/ai')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
            >
              ← Back to AI Workspace
            </button>
            {artifacts && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition"
              >
                <Download className="w-4 h-4" />
                Download Export ZIP
              </button>
            )}
          </div>
        </div>

        {/* Project Selector / Creator Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Idea Input / Generator Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                Start App Builder Idea
              </h2>
              <form onSubmit={handleGenerateIdea} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Project Name (Optional)</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g., E-Commerce Marketplace"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">What do you want to build?</label>
                  <textarea
                    rows={4}
                    value={ideaPrompt}
                    onChange={e => setIdeaPrompt(e.target.value)}
                    placeholder="e.g., متجر إلكتروني متكامل لإدارة المنتجات والطلبات والدفع..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold rounded-xl shadow-md transition"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Specification...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Specification
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Projects List */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Your App Projects</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentProject(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                      currentProject?.id === p.id
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {p.specification ? 'Spec Ready' : 'Idea'}
                    </span>
                  </button>
                ))}
                {projects.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No app builder projects yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Workspace Preview / Pipeline */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            {currentProject ? (
              <div className="flex-1 flex flex-col space-y-6">
                
                {/* Project Header & Pipeline Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentProject.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {currentProject.id} • Created: {new Date(currentProject.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {spec && !artifacts ? (
                      <button
                        onClick={handleApproveAndBuild}
                        disabled={isApproving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition"
                      >
                        {isApproving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Building Architecture & PIR...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Spec & Generate Artifacts
                          </>
                        )}
                      </button>
                    ) : artifacts ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" /> Pipeline Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 text-xs font-semibold">
                        Pending Specification
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('spec')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'spec' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Specification
                  </button>
                  <button
                    onClick={() => setActiveTab('arch')}
                    disabled={!arch}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      activeTab === 'arch' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" /> Architecture Plan
                  </button>
                  <button
                    onClick={() => setActiveTab('pir')}
                    disabled={!pir}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      activeTab === 'pir' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> PIR & Validation
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    disabled={!artifacts}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      activeTab === 'export' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" /> Export Pipeline
                  </button>
                  <button
                    onClick={() => setActiveTab('build')}
                    disabled={!artifacts}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      activeTab === 'build' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <CpuIcon className="w-3.5 h-3.5" /> External Build
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto max-h-[550px] space-y-6 pr-2">
                  
                  {/* Specification Tab */}
                  {activeTab === 'spec' && (
                    <div className="space-y-6">
                      {spec ? (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <h3 className="text-sm font-bold text-indigo-400 mb-1">Application Summary</h3>
                          <p className="text-sm text-slate-300">{spec.description}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic text-center py-12">No specification generated yet.</p>
                      )}
                    </div>
                  )}

                  {/* Export Tab */}
                  {activeTab === 'export' && (
                    <div className="space-y-6">
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white">Build & Export Pipeline</h3>
                        <button
                          onClick={handleDownloadZip}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Download Export ZIP Package
                        </button>
                      </div>
                    </div>
                  )}

                  {/* External Build Tab (Phase 9) */}
                  {activeTab === 'build' && (
                    <div className="space-y-6">
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CpuIcon className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-base font-bold text-white">External Build Orchestration (Phase 9)</h3>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                            EXTERNAL_BUILDER_NOT_CONFIGURED
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Send validated project packages to an isolated external builder (e.g. GitHub Actions). The Kayan Store server never executes generated code or installs arbitrary dependencies.
                        </p>

                        <div className="bg-amber-950/20 border border-amber-800/60 p-4 rounded-xl text-xs text-amber-300 space-y-1">
                          <p className="font-bold">بيئة البناء الخارجية غير مهيأة حاليًا.</p>
                          <p className="text-slate-400">External build provider is not configured. Configure GITHUB_ACTIONS_TOKEN and GITHUB_REPOSITORY to enable live external builds.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Target Platform</label>
                            <select
                              value={targetPlatform}
                              onChange={e => setTargetPlatform(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="WEB">WEB (React / SPA)</option>
                              <option value="ANDROID">ANDROID (Mobile)</option>
                              <option value="IOS">IOS (Mobile)</option>
                              <option value="DESKTOP">DESKTOP</option>
                            </select>
                          </div>
                        </div>

                        {buildError && (
                          <div className="p-3 bg-red-950/20 border border-red-800 rounded-xl text-xs text-red-300">
                            {buildError}
                          </div>
                        )}

                        <button
                          onClick={handleSubmitBuild}
                          disabled={isSubmittingBuild}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                        >
                          {isSubmittingBuild ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Submit External Build Job
                        </button>
                      </div>

                      {/* Build History */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Build History ({buildsList.length})</h4>
                        {buildsList.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No external builds submitted yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {buildsList.map((b, i) => (
                              <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-white font-mono">{b.buildId}</span>
                                  <span className="ml-2 text-slate-400">Target: {b.targetPlatform}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                                  {b.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <Sparkles className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-white">No Application Project Selected</h3>
                <p className="text-sm text-slate-400 max-w-md mt-1">
                  Enter an application idea on the left and click "Generate Specification" to start building with Kayan AI App Builder.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
