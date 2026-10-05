import React, { useState, useEffect, useRef } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { UserCV, CVTemplateType, CVStatus, CVExperience, CVEducation, CVSkill, CVProject, CVCertificate, CVLanguage, CVLink, CVDesignSpecification, TEMPLATE_REGISTRY } from '../../types/cv.ts';
import { FileText, ArrowLeft, ArrowRight, Save, Sparkles, Printer, Download, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Globe, ShieldCheck, User, Briefcase, GraduationCap, Award, Code, BookOpen, Layers, Palette, Sliders } from 'lucide-react';

import { CVPreview } from '../../components/cv/CVPreview.tsx';
import { CVTemplateLibrary } from '../../components/cv/CVTemplateLibrary.tsx';
import { X, FileCode } from 'lucide-react';
import { DEMO_CV_AR, DEMO_CV_EN } from '../../data/demoCv.ts';
import { exportCvToDocx } from '../../utils/cvDocxExport.ts';

interface CVEditorPageProps {
  cvId: string;
  onNavigate: (path: string) => void;
}

export const CVEditorPage: React.FC<CVEditorPageProps> = ({ cvId, onNavigate }) => {
  const { user } = useUserAuth();
  const { lang, dir, t } = useLanguage();

  const [cv, setCv] = useState<UserCV | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [activeTab, setActiveTab] = useState<'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certificates' | 'languages' | 'design'>('personal');
  
  // AI Loading state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState<boolean>(false);

  const saveTimeoutRef = useRef<any>(null);

  // Fetch CV
  useEffect(() => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    const fetchCv = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/cv/${cvId}`);
        if (!res.ok) {
          const text = await res.text();
          if (text.startsWith('<!doctype')) {
            throw new Error('Server returned HTML instead of JSON. Check route registration and proxy.');
          }
          throw new Error(`Server error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.cv) {
          console.log('[CV TEMPLATE DEBUG] CV template:', data.cv.template);
          
          // Ensure all arrays exist even if DB returned null/undefined
          const sanitizedCv = {
            ...data.cv,
            experiences: data.cv.experiences || [],
            education: data.cv.education || [],
            skills: data.cv.skills || [],
            projects: data.cv.projects || [],
            certificates: data.cv.certificates || [],
            languages: data.cv.languages || [],
            links: data.cv.links || [],
          };

          // Ensure designSpec is initialized and has full section list
          if (!sanitizedCv.designSpec || Object.keys(sanitizedCv.designSpec).length === 0) {
            sanitizedCv.designSpec = {
              primaryColor: '#0284c7',
              headingColor: '#0f172a',
              fontFamily: 'sans',
              fontSize: 'md',
              spacing: 'normal',
              headerStyle: 'left_aligned',
              columns: 'single',
              sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
              hiddenSections: [],
              photoSize: 'none',
              contentDensity: 'normal',
              targetPageCount: 1
            };
          }
          setCv(sanitizedCv);
        } else {
          alert(data.error || 'السيرة الذاتية غير موجودة');
          onNavigate('/cv');
        }
      } catch (err: any) {
        console.error('Failed to load CV:', err);
        alert(`تعذر تحميل السيرة الذاتية: ${err.message}`);
        onNavigate('/cv');
      } finally {
        setLoading(false);
      }
    };
    fetchCv();
  }, [cvId, user]);

  // Trigger Autosave
  const triggerAutosave = (updatedCv: UserCV) => {
    setCv(updatedCv);
    setSavingStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cv/${cvId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedCv)
        });
        const data = await res.json();
        if (data.success) {
          setSavingStatus('saved');
        } else {
          setSavingStatus('error');
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setSavingStatus('error');
      }
    }, 1000);
  };

  const handleTemplateSelect = (templateId: CVTemplateType) => {
    if (!cv) return;

    // Check if the current CV is effectively blank/empty or just has basic info
    const isSparse = 
      cv.experiences.length === 0 && 
      cv.education.length === 0 && 
      cv.skills.length === 0 &&
      cv.projects.length === 0 &&
      (!cv.summary || cv.summary.trim().length < 20);

    let updated: UserCV;

    if (isSparse) {
      // Use Demo Data but keep the user's specific fields like id, userId, title, etc.
      // We prioritize user's name/email if they entered them, otherwise use demo
      const baseDemo = cv.language === 'ar' ? DEMO_CV_AR : DEMO_CV_EN;
      updated = {
        ...baseDemo,
        id: cv.id,
        userId: cv.userId,
        title: cv.title,
        language: cv.language,
        status: cv.status,
        isPrimary: cv.isPrimary,
        createdAt: cv.createdAt,
        updatedAt: new Date().toISOString(),
        template: templateId,
        personalInfo: {
          ...baseDemo.personalInfo,
          // Keep user's name/email/phone if they provided them
          fullName: cv.personalInfo.fullName || baseDemo.personalInfo.fullName,
          email: cv.personalInfo.email || baseDemo.personalInfo.email,
          phone: cv.personalInfo.phone || baseDemo.personalInfo.phone,
          headline: cv.personalInfo.headline || baseDemo.personalInfo.headline,
        }
      };
    } else {
      // Just change the template and apply defaults
      updated = { ...cv, template: templateId };
    }

    // Apply template-specific design defaults
    const templateInfo = TEMPLATE_REGISTRY.find(t => t.id === templateId);
    if (templateInfo && templateInfo.defaultDesignSpec) {
      updated.designSpec = {
        ...(updated.designSpec || {
          primaryColor: '#0284c7',
          headingColor: '#0f172a',
          fontFamily: 'sans',
          fontSize: 'md',
          spacing: 'normal',
          headerStyle: 'left_aligned',
          columns: 'single',
          sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
          hiddenSections: [],
          photoSize: 'medium',
          contentDensity: 'normal',
          targetPageCount: 1
        }),
        ...templateInfo.defaultDesignSpec
      };
    }

    triggerAutosave(updated);
    setShowTemplateLibrary(false);
  };

  const handleFieldChange = (field: keyof UserCV, value: any) => {
    if (!cv) return;
    let updated = { ...cv, [field]: value };
    
    // If template changed, apply default design spec for that template
    if (field === 'template') {
      const templateInfo = TEMPLATE_REGISTRY.find(t => t.id === value);
      if (templateInfo && templateInfo.defaultDesignSpec) {
        updated.designSpec = {
          ...updated.designSpec!,
          ...templateInfo.defaultDesignSpec
        };
      }
    }
    
    triggerAutosave(updated);
  };

  const handleDesignSpecChange = (field: keyof CVDesignSpecification, value: any) => {
    if (!cv) return;
    const currentSpec = cv.designSpec || {
      primaryColor: '#0284c7',
      headingColor: '#0f172a',
      fontFamily: 'sans',
      fontSize: 'md',
      spacing: 'normal',
      headerStyle: 'left_aligned',
      columns: 'single',
      sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
      hiddenSections: [],
      photoSize: 'none',
      contentDensity: 'normal',
      targetPageCount: 1
    };
    const updated = {
      ...cv,
      designSpec: { ...currentSpec, [field]: value }
    };
    triggerAutosave(updated);
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    if (!cv) return;
    const updated = {
      ...cv,
      personalInfo: { ...cv.personalInfo, [field]: value }
    };
    triggerAutosave(updated);
  };

  // List managers
  const addItem = (section: 'experiences' | 'education' | 'skills' | 'projects' | 'certificates' | 'languages' | 'links') => {
    if (!cv) return;
    const id = Math.random().toString(36).substring(2, 9);
    let newItem: any = { id };
    if (section === 'experiences') {
      newItem = { id, company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '', achievements: [] };
    } else if (section === 'education') {
      newItem = { id, institution: '', degree: '', field: '', location: '', startDate: '', endDate: '', grade: '' };
    } else if (section === 'skills') {
      newItem = { id, name: '', level: 'intermediate', category: '' };
    } else if (section === 'projects') {
      newItem = { id, title: '', description: '', url: '', technologies: [] };
    } else if (section === 'certificates') {
      newItem = { id, name: '', issuer: '', date: '', url: '' };
    } else if (section === 'languages') {
      newItem = { id, name: '', proficiency: 'fluent' };
    } else if (section === 'links') {
      newItem = { id, platform: '', url: '' };
    }

    const updated = {
      ...cv,
      [section]: [...(cv[section] || []), newItem]
    };
    triggerAutosave(updated);
  };

  const updateItem = (section: string, id: string, field: string, value: any) => {
    if (!cv) return;
    const list = (cv as any)[section].map((item: any) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    triggerAutosave({ ...cv, [section]: list });
  };

  const removeItem = (section: string, id: string) => {
    if (!cv) return;
    const list = (cv as any)[section].filter((item: any) => item.id !== id);
    triggerAutosave({ ...cv, [section]: list });
  };

  // AI Designer Execution with JSON response
  const handleAiDesignerRun = async (params: any) => {
    if (!cv || !user) return;
    try {
      setAiLoading(true);
      const prompt = `أنت خبير تصميم وتوظيف محترف لـ Kayan CV. قم بتحليل الطلب التالي وتوليد تصميم متكامل للسيرة الذاتية (Design Specification) ومحتوى احترافي.
يجب أن يكون الرد بصيغة JSON حصراً كما في المثال أدناه:

الطلب:
- المجال المهني: ${params.field || 'عام'}
- الوظيفة المستهدفة: ${params.targetJob || cv.targetJobTitle || 'محترف'}
- مستوى الخبرة: ${params.expLevel}
- النمط المطلوب: ${params.style}

مثال للرد المتوقع (JSON):
{
  "template": "executive",
  "primaryColor": "#1e40af",
  "headingColor": "#111827",
  "fontFamily": "serif",
  "fontSize": "md",
  "spacing": "normal",
  "headerStyle": "centered",
  "contentDensity": "normal",
  "sectionOrder": ["summary", "experience", "education", "skills", "projects", "certificates", "languages", "links"],
  "summary": "النبذة المهنية المحسنة هنا...",
  "suggestedSkills": ["Skill 1", "Skill 2"]
}

القوالب المتاحة: professional_classic, modern_professional, executive, tech, minimal, ats_friendly, academic, administrative, creative, modern_elegant, two_column, corporate_formal, graduate_entry, senior_experienced, creative_roles.
خيارات fontSize: sm, md, lg.
خيارات spacing: compact, normal, spacious.
خيارات contentDensity: compact, normal, spacious.
خيارات headerStyle: centered, left_aligned, split, banner.
تأكد من عدم اختلاق أي خبرات أو تواريخ.`;

      const response = await fetch('/api/ai/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (data.success && data.text) {
        let aiConfig: any = {};
        try {
          // Clean the response if it contains markdown code blocks
          const cleanJson = data.text.replace(/```json|```/g, '').trim();
          aiConfig = JSON.parse(cleanJson);
        } catch (e) {
          console.warn('Failed to parse AI JSON');
        }

        const chosenTemplate = aiConfig.template || cv.template;
        const updated: UserCV = {
          ...cv,
          template: chosenTemplate as CVTemplateType,
          targetJobTitle: params.targetJob || cv.targetJobTitle,
          summary: aiConfig.summary || cv.summary,
          designSpec: {
            ...cv.designSpec!,
            primaryColor: aiConfig.primaryColor || cv.designSpec?.primaryColor || '#0284c7',
            headingColor: aiConfig.headingColor || cv.designSpec?.headingColor || '#0f172a',
            fontFamily: aiConfig.fontFamily || cv.designSpec?.fontFamily || 'sans',
            fontSize: aiConfig.fontSize || cv.designSpec?.fontSize || 'md',
            spacing: aiConfig.spacing || cv.designSpec?.spacing || 'normal',
            headerStyle: aiConfig.headerStyle || cv.designSpec?.headerStyle || 'left_aligned',
            contentDensity: aiConfig.contentDensity || cv.designSpec?.contentDensity || 'normal',
            sectionOrder: Array.isArray(aiConfig.sectionOrder) ? aiConfig.sectionOrder : (cv.designSpec?.sectionOrder || []),
            columns: chosenTemplate === 'two_column' || chosenTemplate === 'tech' || chosenTemplate === 'creative' || chosenTemplate === 'creative_roles' || aiConfig.columns === 'two_column' ? 'two_column' : 'single'
          }
        };
        
        // Add suggested skills if they don't exist
        if (Array.isArray(aiConfig.suggestedSkills)) {
          const currentSkillNames = cv.skills.map(s => s.name.toLowerCase());
          const newSkills = aiConfig.suggestedSkills
            .filter((s: string) => !currentSkillNames.includes(s.toLowerCase()))
            .map((s: string) => ({ id: Math.random().toString(36).substring(2, 9), name: s, level: 'intermediate' }));
          updated.skills = [...cv.skills, ...newSkills];
        }

        triggerAutosave(updated);
        setShowTemplateLibrary(false);
      } else {
        alert(data.error || 'تعذر توليد تصميم الذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.error('AI Designer error:', err);
      alert(err.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!cv) return;
    try {
      setExportLoading(true);
      
      // 1. Force save first to ensure PDF is up to date
      const res = await fetch(`/api/cv/${cvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cv)
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to save before export');

      // 2. Short delay to ensure any images/fonts are settled
      await new Promise(r => setTimeout(r, 800));

      // 3. Set page title for filename (Browsers use this as default filename)
      const originalTitle = document.title;
      const cleanName = (cv.personalInfo.fullName || 'CV').trim().replace(/\s+/g, '_');
      document.title = `${cleanName}_Kayan_CV`;

      // 4. Trigger print
      window.print();

      // 5. Restore title
      document.title = originalTitle;
    } catch (err) {
      console.error('Export error:', err);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (!cv) return;
    try {
      setExportLoading(true);
      
      // 1. Force save first
      await fetch(`/api/cv/${cvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cv)
      });

      // 2. Run export utility
      await exportCvToDocx(cv);
    } catch (err) {
      console.error('Word export error:', err);
      alert('حدث خطأ أثناء تصدير ملف Word');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading || !cv) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-3" />
        <p>{lang === 'ar' ? 'جاري تحميل محرر السيرة الذاتية...' : 'Loading CV editor...'}</p>
      </div>
    );
  }

  const design = cv.designSpec || {
    primaryColor: '#0284c7',
    headingColor: '#0f172a',
    fontFamily: 'sans',
    fontSize: 'md',
    spacing: 'normal',
    headerStyle: 'left_aligned',
    columns: 'single',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
    hiddenSections: [],
    photoSize: 'none',
    contentDensity: 'normal',
    targetPageCount: 1
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          /* Remove header/footer injected by browser if possible */
          @page {
            margin: 0;
          }
        }
      `}} />
      {/* Top Navbar / Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/cv')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
          >
            {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{lang === 'ar' ? 'العودة للقائمة' : 'Back to List'}</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
          <input
            type="text"
            value={cv.title}
            onChange={e => handleFieldChange('title', e.target.value)}
            className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1 py-0.5 max-w-xs truncate"
            placeholder={lang === 'ar' ? 'عنوان السيرة الذاتية' : 'Resume Title'}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Design Studio Button */}
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'استوديو التصميم' : 'Design Studio'}</span>
          </button>

          {/* Autosave Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {savingStatus === 'saving' && (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                {lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lang === 'ar' ? 'تم الحفظ' : 'Saved'}
              </span>
            )}
            {savingStatus === 'error' && (
              <span className="text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {lang === 'ar' ? 'تعذر الحفظ' : 'Save Error'}
              </span>
            )}
          </div>

          {/* Status Switcher */}
          <select
            value={cv.status}
            onChange={e => handleFieldChange('status', e.target.value as CVStatus)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="draft">{lang === 'ar' ? 'مسودة (Draft)' : 'Draft'}</option>
            <option value="published">{lang === 'ar' ? 'منشور (Published)' : 'Published'}</option>
          </select>

          {/* Word Export */}
          <button
            onClick={handleExportDocx}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all disabled:opacity-50"
            title={lang === 'ar' ? 'تصدير بصيغة Word' : 'Export as Word'}
          >
            <FileCode className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden md:inline">{lang === 'ar' ? 'تصدير Word' : 'Export Word'}</span>
          </button>

          {/* Print / Export PDF */}
          <button
            onClick={handleExportPdf}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all disabled:opacity-50"
            title={lang === 'ar' ? 'تصدير بصيغة PDF' : 'Export as PDF'}
          >
            {exportLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">
              {exportLoading ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (lang === 'ar' ? 'تصدير PDF' : 'Export PDF')}
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left / Editor Panel (7 Cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white border-e border-slate-200 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto no-print">
          
          {/* Section Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50 p-2 gap-1 shrink-0">
            {[
              { id: 'personal', label: lang === 'ar' ? 'المعلومات' : 'Personal', icon: User },
              { id: 'summary', label: lang === 'ar' ? 'النبذة' : 'Summary', icon: BookOpen },
              { id: 'experience', label: lang === 'ar' ? 'الخبرات' : 'Experience', icon: Briefcase },
              { id: 'education', label: lang === 'ar' ? 'التعليم' : 'Education', icon: GraduationCap },
              { id: 'skills', label: lang === 'ar' ? 'المهارات' : 'Skills', icon: Code },
              { id: 'projects', label: lang === 'ar' ? 'المشاريع' : 'Projects', icon: Layers },
              { id: 'certificates', label: lang === 'ar' ? 'الشهادات' : 'Certificates', icon: Award },
              { id: 'languages', label: lang === 'ar' ? 'اللغات' : 'Languages', icon: Globe },
              { id: 'design', label: lang === 'ar' ? 'التخطيط' : 'Layout', icon: Palette }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 flex-1">
            
            {/* 1. Personal Info */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {lang === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.fullName}
                      onChange={e => handlePersonalInfoChange('fullName', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'المسمى الوظيفي المستهدف' : 'Target Headline'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.headline}
                      onChange={e => handlePersonalInfoChange('headline', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="Senior Full Stack Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input
                      type="email"
                      value={cv.personalInfo.email}
                      onChange={e => handlePersonalInfoChange('email', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.phone}
                      onChange={e => handlePersonalInfoChange('phone', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'رابط الصورة الشخصية' : 'Photo URL'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.photoUrl || ''}
                      onChange={e => handlePersonalInfoChange('photoUrl', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'الموقع (المدينة، الدولة)' : 'Location'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.location}
                      onChange={e => handlePersonalInfoChange('location', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={cv.personalInfo.linkedin || ''}
                      onChange={e => handlePersonalInfoChange('linkedin', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={cv.personalInfo.github || ''}
                      onChange={e => handlePersonalInfoChange('github', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'موقع شخصي / معرض أعمال' : 'Portfolio URL'}</label>
                    <input
                      type="text"
                      value={cv.personalInfo.portfolio || ''}
                      onChange={e => handlePersonalInfoChange('portfolio', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'النبذة المهنية' : 'Professional Summary'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'اكتب ملخصاً مركزاً يبرز خبراتك الرئيسية وقيمتك المضافة لأصحاب العمل.'
                    : 'Write a concise summary highlighting your core expertise and value proposition.'}
                </p>
                <textarea
                  rows={6}
                  value={cv.summary || ''}
                  onChange={e => handleFieldChange('summary', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none leading-relaxed"
                />
              </div>
            )}

            {/* 3. Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'الخبرات المهنية' : 'Work Experience'}
                  </h3>
                  <button
                    onClick={() => addItem('experiences')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة خبرة' : 'Add Experience'}</span>
                  </button>
                </div>

                {cv.experiences.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    {lang === 'ar' ? 'لم تضف أي خبرات بعد' : 'No experiences added yet'}
                  </p>
                ) : (
                  cv.experiences.map((exp, idx) => (
                    <div key={exp.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 relative">
                      <button
                        onClick={() => removeItem('experiences', exp.id)}
                        className="absolute top-3 end-3 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <h4 className="text-xs font-bold text-slate-600">#{idx + 1}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={exp.position}
                          onChange={e => updateItem('experiences', exp.id, 'position', e.target.value)}
                          placeholder={lang === 'ar' ? 'المسمى الوظيفي' : 'Position'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={e => updateItem('experiences', exp.id, 'company', e.target.value)}
                          placeholder={lang === 'ar' ? 'اسم الشركة' : 'Company'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={e => updateItem('experiences', exp.id, 'startDate', e.target.value)}
                          placeholder={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={e => updateItem('experiences', exp.id, 'endDate', e.target.value)}
                          placeholder={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={e => updateItem('experiences', exp.id, 'description', e.target.value)}
                        placeholder={lang === 'ar' ? 'وصف المهام والإنجازات...' : 'Description...'}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Education */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'التعليم الأكاديمي' : 'Education'}
                  </h3>
                  <button
                    onClick={() => addItem('education')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة تعليم' : 'Add Education'}</span>
                  </button>
                </div>

                {cv.education.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    {lang === 'ar' ? 'لم تضف أي مؤهل أكاديمي بعد' : 'No education added yet'}
                  </p>
                ) : (
                  cv.education.map((edu, idx) => (
                    <div key={edu.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 relative">
                      <button
                        onClick={() => removeItem('education', edu.id)}
                        className="absolute top-3 end-3 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <h4 className="text-xs font-bold text-slate-600">#{idx + 1}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={e => updateItem('education', edu.id, 'institution', e.target.value)}
                          placeholder={lang === 'ar' ? 'اسم الجامعة' : 'Institution'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => updateItem('education', edu.id, 'degree', e.target.value)}
                          placeholder={lang === 'ar' ? 'الدرجة العلمية' : 'Degree'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={edu.field}
                          onChange={e => updateItem('education', edu.id, 'field', e.target.value)}
                          placeholder={lang === 'ar' ? 'التخصص' : 'Field'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={e => updateItem('education', edu.id, 'endDate', e.target.value)}
                          placeholder={lang === 'ar' ? 'سنة التخرج' : 'Graduation Year'}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'المهارات' : 'Skills'}
                  </h3>
                  <button
                    onClick={() => addItem('skills')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة مهارة' : 'Add Skill'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cv.skills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={e => updateItem('skills', skill.id, 'name', e.target.value)}
                        placeholder={lang === 'ar' ? 'اسم المهارة' : 'Skill name'}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                      />
                      <button
                        onClick={() => removeItem('skills', skill.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'المشاريع' : 'Projects'}
                  </h3>
                  <button
                    onClick={() => addItem('projects')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة مشروع' : 'Add Project'}</span>
                  </button>
                </div>

                {cv.projects.map((proj, idx) => (
                  <div key={proj.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 relative">
                    <button
                      onClick={() => removeItem('projects', proj.id)}
                      className="absolute top-3 end-3 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={e => updateItem('projects', proj.id, 'title', e.target.value)}
                      placeholder={lang === 'ar' ? 'عنوان المشروع' : 'Project Title'}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
                    />
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={e => updateItem('projects', proj.id, 'description', e.target.value)}
                      placeholder={lang === 'ar' ? 'وصف المشروع...' : 'Project description...'}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 7. Certificates & Languages */}
            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'الشهادات والدورات' : 'Certificates'}
                  </h3>
                  <button
                    onClick={() => addItem('certificates')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة شهادة' : 'Add Certificate'}</span>
                  </button>
                </div>

                {cv.certificates.map(cert => (
                  <div key={cert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 relative">
                    <button
                      onClick={() => removeItem('certificates', cert.id)}
                      className="absolute top-3 end-3 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={e => updateItem('certificates', cert.id, 'name', e.target.value)}
                        placeholder={lang === 'ar' ? 'اسم الشهادة' : 'Certificate Name'}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={e => updateItem('certificates', cert.id, 'issuer', e.target.value)}
                        placeholder={lang === 'ar' ? 'الجهة المانحة' : 'Issuer'}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'languages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'اللغات' : 'Languages'}
                  </h3>
                  <button
                    onClick={() => addItem('languages')}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إضافة لغة' : 'Add Language'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cv.languages.map(langItem => (
                    <div key={langItem.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <input
                        type="text"
                        value={langItem.name}
                        onChange={e => updateItem('languages', langItem.id, 'name', e.target.value)}
                        placeholder={lang === 'ar' ? 'اللغة' : 'Language'}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                      />
                      <button
                        onClick={() => removeItem('languages', langItem.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. Design Customization Tab */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {lang === 'ar' ? 'تخصيص التصميم والقالب' : 'Design & Template Customization'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'اختر القالب، ألوان الهوية، الخطوط، وتخطيط الأعمدة.' : 'Select template, color palette, typography, and column layout.'}
                  </p>
                </div>

                {/* Template Registry Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{lang === 'ar' ? 'قالب السيرة الذاتية (15+ قالب)' : 'Template'}</label>
                  <select
                    value={cv.template}
                    onChange={e => handleFieldChange('template', e.target.value as CVTemplateType)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium"
                  >
                    {TEMPLATE_REGISTRY.map(t => (
                      <option key={t.id} value={t.id}>
                        {lang === 'ar' ? t.nameAr : t.nameEn} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={e => handleDesignSpecChange('primaryColor', e.target.value)}
                        className="h-8 w-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-mono">{design.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'لون العناوين' : 'Heading Color'}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.headingColor}
                        onChange={e => handleDesignSpecChange('headingColor', e.target.value)}
                        className="h-8 w-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-mono">{design.headingColor}</span>
                    </div>
                  </div>
                </div>

                {/* Typography / Font Family */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'نوع الخط' : 'Font Family'}</label>
                  <select
                    value={design.fontFamily}
                    onChange={e => handleDesignSpecChange('fontFamily', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="sans">Sans-Serif (عصري نظيف)</option>
                    <option value="serif">Serif (كلاسيكي رسمي)</option>
                    <option value="mono">Monospace (تقني)</option>
                    <option value="inter">Inter (دولي حديث)</option>
                    <option value="cormorant">Cormorant (فاخر)</option>
                  </select>
                </div>

                {/* Header Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'شكل الرأس (Header Style)' : 'Header Style'}</label>
                  <select
                    value={design.headerStyle}
                    onChange={e => handleDesignSpecChange('headerStyle', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="left_aligned">{lang === 'ar' ? 'محاذاة لليسار' : 'Left Aligned'}</option>
                    <option value="centered">{lang === 'ar' ? 'في المنتصف' : 'Centered'}</option>
                    <option value="split">{lang === 'ar' ? 'مقسوم مع شريط جانبي' : 'Split / Banner'}</option>
                  </select>
                </div>

                {/* Columns */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'عدد الأعمدة' : 'Columns'}</label>
                  <select
                    value={design.columns}
                    onChange={e => handleDesignSpecChange('columns', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="single">{lang === 'ar' ? 'عمود واحد (Single Column)' : 'Single Column'}</option>
                    <option value="two_column">{lang === 'ar' ? 'عمودان (Two Column)' : 'Two Column'}</option>
                  </select>
                </div>

                {/* Spacing Density */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'ar' ? 'كثافة المحتوى والمسافات' : 'Content Density'}</label>
                  <select
                    value={design.spacing}
                    onChange={e => handleDesignSpecChange('spacing', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="compact">{lang === 'ar' ? 'مضغوط (Compact)' : 'Compact'}</option>
                    <option value="normal">{lang === 'ar' ? 'عادي (Normal)' : 'Normal'}</option>
                    <option value="spacious">{lang === 'ar' ? 'واسع (Spacious)' : 'Spacious'}</option>
                  </select>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Right / Live Preview Panel (6 Cols on lg) */}
        <div className="lg:flex lg:col-span-6 xl:col-span-7 bg-slate-300/50 p-12 items-start justify-center overflow-y-auto h-[calc(100vh-4rem)] pattern-grid-slate-200 print:bg-white print:p-0 print:overflow-visible print:h-auto print:block">
          <div className="shadow-2xl mb-20 print:shadow-none print:mb-0 cv-print-container">
            <CVPreview cv={cv} lang={cv.language} />
          </div>
        </div>

      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          <div className="flex-1 overflow-hidden flex flex-col">
            <CVTemplateLibrary 
              cv={cv} 
              onSelect={handleTemplateSelect}
              onAiDesign={handleAiDesignerRun}
              aiLoading={aiLoading}
            />
          </div>
          <button 
            onClick={() => setShowTemplateLibrary(false)}
            className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur-sm p-2 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
