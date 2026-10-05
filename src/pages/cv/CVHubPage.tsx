import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { UserCV, CVTemplateType, TEMPLATE_REGISTRY } from '../../types/cv.ts';
import { FileText, Plus, Sparkles, Copy, Trash2, Edit3, Globe, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight, User, Layers, Palette } from 'lucide-react';

import { CVTemplateLibrary } from '../../components/cv/CVTemplateLibrary.tsx';
import { X } from 'lucide-react';
import { DEMO_CV_AR, DEMO_CV_EN } from '../../data/demoCv.ts';

interface CVHubPageProps {
  onNavigate: (path: string) => void;
}

export const CVHubPage: React.FC<CVHubPageProps> = ({ onNavigate }) => {
  const { user } = useUserAuth();
  const { lang, dir, t } = useLanguage();
  const [cvs, setCvs] = useState<UserCV[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateType>('professional_classic');

  const fetchCvs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/cv');
      const data = await res.json();
      if (data.success) {
        setCvs(data.cvs || []);
      } else {
        setError(data.error || 'فشل في تحميل السير الذاتية');
      }
    } catch (err) {
      console.error('Error fetching CVs:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, [user]);

  const handleCreateNew = async (template: CVTemplateType = selectedTemplate, language: 'ar' | 'en' = lang) => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      setCreating(true);
      const baseDemo = language === 'ar' ? DEMO_CV_AR : DEMO_CV_EN;
      const templateInfo = TEMPLATE_REGISTRY.find(t => t.id === template);
      
      const payload = {
        title: language === 'ar' ? 'سيرة ذاتية جديدة' : 'New Resume',
        language,
        template,
        status: 'draft',
        isPrimary: cvs.length === 0,
        personalInfo: {
          ...baseDemo.personalInfo,
          fullName: user.name || baseDemo.personalInfo.fullName,
          email: user.email || baseDemo.personalInfo.email,
        },
        summary: baseDemo.summary,
        experiences: baseDemo.experiences,
        education: baseDemo.education,
        skills: baseDemo.skills,
        projects: baseDemo.projects,
        certificates: baseDemo.certificates,
        languages: baseDemo.languages,
        links: baseDemo.links,
        designSpec: {
          ...baseDemo.designSpec,
          ...(templateInfo?.defaultDesignSpec || {}),
          columns: template === 'two_column' || template === 'tech' || (templateInfo?.defaultDesignSpec?.columns) === 'two_column' ? 'two_column' : 'single',
          sectionOrder: baseDemo.designSpec?.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links']
        }
      };

      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.cv) {
        onNavigate(`/cv/${data.cv.id}`);
      } else {
        alert(data.error || 'فشل في إنشاء السيرة الذاتية');
      }
    } catch (err) {
      console.error('Failed to create CV:', err);
      alert('حدث خطأ أثناء الإنشاء');
    } finally {
      setCreating(false);
      setShowTemplateModal(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه السيرة الذاتية؟' : 'Are you sure you want to delete this CV?')) {
      return;
    }
    try {
      const res = await fetch(`/api/cv/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCvs(prev => prev.filter(c => c.id !== id));
      } else {
        alert(data.error || 'فشل الحذف');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('تعذر حذف السيرة الذاتية');
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/cv/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.cv) {
        setCvs(prev => [data.cv, ...prev]);
      } else {
        alert(data.error || 'فشل النسخ');
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      alert('تعذر نسخ السيرة الذاتية');
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-6 border border-sky-100">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {lang === 'ar' ? 'منشئ السيرة الذاتية الاحترافية - Kayan CV' : 'Professional CV Builder - Kayan CV'}
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
          {lang === 'ar'
            ? 'أنشئ سيرة ذاتية احترافية باللغتين العربية والإنجليزية مع مكتبة قوالب واسعة (15+ قالب)، تخصيص كامل للخطوط والألوان، ومصمم ذكي يعمل بالذكاء الاصطناعي.'
            : 'Create professional resumes in Arabic and English with 15+ templates, full customization, and AI Designer assistance.'}
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-all"
        >
          <User className="h-4 w-4" />
          <span>{lang === 'ar' ? 'تسجيل الدخول للبدء' : 'Login to Get Started'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kayan CV Studio — 15+ Templates & AI Designer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {lang === 'ar' ? 'إدارة السير الذاتية' : 'Resume Management'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'ar'
              ? 'صمم سيرتك الذاتية باحترافية مع مكتبة قوالب واسعة، تخصيص غير محدود، ومصمم Kayan AI.'
              : 'Design professional resumes with an extensive template library, limitless customization, and Kayan AI Designer.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إنشاء سيرة جديدة' : 'Create New CV'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-3" />
          <p>{lang === 'ar' ? 'جاري تحميل سيرتك الذاتية...' : 'Loading your resumes...'}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{error}</p>
          <button onClick={fetchCvs} className="mt-3 text-xs font-bold underline">
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : cvs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {lang === 'ar' ? 'ليس لديك أي سيرة ذاتية حتى الآن' : 'No resumes created yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {lang === 'ar'
              ? 'اختر من بين 15+ قالبًا احترافيًا وابدأ بإنشاء سيرتك الذاتية الأولى مع المصمم الذكي.'
              : 'Choose from 15+ professional templates and create your first resume with AI Designer.'}
          </p>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'أنشئ سيرتك الأولى' : 'Create Your First CV'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map(cv => (
            <div
              key={cv.id}
              onClick={() => onNavigate(`/cv/${cv.id}`)}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 uppercase">
                      {cv.language}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 capitalize">
                      {cv.template.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cv.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {cv.status === 'published' ? (lang === 'ar' ? 'منشور' : 'Published') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors mb-1 truncate">
                  {cv.title || (lang === 'ar' ? 'بدون عنوان' : 'Untitled CV')}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                  {cv.personalInfo.fullName} {cv.personalInfo.headline ? `· ${cv.personalInfo.headline}` : ''}
                </p>

                <div className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'آخر تحديث: ' : 'Updated: '}
                  {new Date(cv.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:underline">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'تعديل وتخصيص' : 'Customize & Edit'}</span>
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleDuplicate(cv.id, e)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title={lang === 'ar' ? 'نسخ' : 'Duplicate'}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={e => handleDelete(cv.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          <div className="flex-1 overflow-hidden flex flex-col">
            <CVTemplateLibrary 
              cv={{
                // Mock CV for creation preview
                id: 'new', userId: user.id, title: '', language: lang, template: selectedTemplate, status: 'draft', isPrimary: false,
                personalInfo: { fullName: user.name || '', email: user.email || '', phone: '', location: '', headline: '' },
                experiences: [], education: [], skills: [], projects: [], certificates: [], languages: [], links: [],
                createdAt: '', updatedAt: '',
                designSpec: {
                  primaryColor: '#0284c7', headingColor: '#0f172a', fontFamily: 'sans', fontSize: 'md', spacing: 'normal',
                  headerStyle: 'left_aligned', columns: 'single', sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
                  hiddenSections: [], photoSize: 'none', contentDensity: 'normal', targetPageCount: 1
                }
              }} 
              onSelect={(template: CVTemplateType) => {
                setSelectedTemplate(template);
                handleCreateNew(template, lang);
              }}
              onAiDesign={async (params: any) => {
                // For creation flow, we just handle template select then redirect to editor where AI can be re-run
                // Or better: Create the CV first then the editor will handle the AI design
                await handleCreateNew(selectedTemplate, lang);
              }}
              aiLoading={creating}
            />
          </div>
          <button 
            onClick={() => setShowTemplateModal(false)}
            className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur-sm p-2 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
