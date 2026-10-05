import React, { useState } from 'react';
import { UserCV, CVTemplateType, TEMPLATE_REGISTRY } from '../../types/cv.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CVPreview } from './CVPreview.tsx';
import { Sparkles, Maximize2, Check, Star, Search, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Layout, Wand2, Globe } from 'lucide-react';
import { DEMO_CV_AR, DEMO_CV_EN } from '../../data/demoCv.ts';

interface CVTemplateLibraryProps {
  cv: UserCV;
  onSelect: (template: CVTemplateType) => void;
  onAiDesign: (params: any) => Promise<void>;
  aiLoading: boolean;
}

export const CVTemplateLibrary: React.FC<CVTemplateLibraryProps> = ({ cv, onSelect, onAiDesign, aiLoading }) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'templates' | 'ai'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateType>(cv.template);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullPreviewTemplate, setFullPreviewTemplate] = useState<CVTemplateType | null>(null);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>(cv.language);

  // Helper to get demo CV with specific template and language
  const getDemoCv = (templateId: CVTemplateType, language: 'ar' | 'en'): UserCV => {
    const baseDemo = language === 'ar' ? DEMO_CV_AR : DEMO_CV_EN;
    const templateInfo = TEMPLATE_REGISTRY.find(t => t.id === templateId);
    
    return {
      ...baseDemo,
      template: templateId,
      designSpec: {
        ...baseDemo.designSpec!,
        ...(templateInfo?.defaultDesignSpec || {})
      }
    };
  };

  // AI Form State
  const [aiField, setAiField] = useState('');
  const [aiTargetJob, setAiTargetJob] = useState(cv.targetJobTitle || '');
  const [aiExpLevel, setAiExpLevel] = useState('mid');
  const [aiStyle, setAiStyle] = useState('modern');

  const filteredTemplates = TEMPLATE_REGISTRY.filter(tmpl => {
    const name = lang === 'ar' ? tmpl.nameAr : tmpl.nameEn;
    const category = tmpl.category;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAiDesign({
      field: aiField,
      targetJob: aiTargetJob,
      expLevel: aiExpLevel,
      style: aiStyle
    });
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'formal': return lang === 'ar' ? 'رسمي' : 'Official';
      case 'modern': return lang === 'ar' ? 'حديث' : 'Modern';
      case 'creative': return lang === 'ar' ? 'إبداعي' : 'Creative';
      case 'technical': return lang === 'ar' ? 'تقني' : 'Technical';
      case 'executive': return lang === 'ar' ? 'تنفيذي' : 'Executive';
      case 'ats': return lang === 'ar' ? 'ATS Friendly' : 'ATS Friendly';
      default: return cat;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Library Header & Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-sky-600" />
            {lang === 'ar' ? 'مكتبة القوالب والتصميم' : 'Template & Design Library'}
          </h2>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {lang === 'ar' ? 'القوالب الجاهزة' : 'Ready Templates'}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ai' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'تصميم بواسطة AI' : 'Design by AI'}
            </button>
          </div>
        </div>

        {activeTab === 'templates' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث عن قالب (رسمي، حديث، ATS...)' : 'Search templates (Official, Modern, ATS...)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTemplates.map((tmpl) => {
              const isSelected = tmpl.id === selectedTemplate;
              const isAiRecommended = tmpl.category === 'executive' || tmpl.id === 'ats_friendly';
              
              return (
                <div 
                  key={tmpl.id} 
                  className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col ${
                    isSelected ? 'border-sky-500 shadow-lg ring-4 ring-sky-50' : 'border-transparent hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[3/4] bg-white overflow-hidden border-b border-slate-100 flex justify-center">
                    <div className="scale-[0.22] origin-top transition-transform duration-500 group-hover:scale-[0.24]">
                      <CVPreview cv={getDemoCv(tmpl.id, lang as 'ar' | 'en')} scale={1} showPageMarkers={false} />
                    </div>
                    
                    {/* Overlay Buttons */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                      <button 
                        onClick={() => setFullPreviewTemplate(tmpl.id)}
                        className="w-full max-w-[160px] bg-white text-slate-900 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'معاينة كاملة' : 'Full Preview'}
                      </button>
                      <button 
                        onClick={() => {
                          console.log('[CV TEMPLATE DEBUG] selected template:', tmpl.id);
                          setSelectedTemplate(tmpl.id);
                          onSelect(tmpl.id);
                        }}
                        className="w-full max-w-[160px] bg-sky-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-700 transition-colors shadow-lg shadow-sky-900/20"
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        {isSelected ? (lang === 'ar' ? 'القالب المختار' : 'Current Template') : (lang === 'ar' ? 'استخدام هذا القالب' : 'Use this Template')}
                      </button>
                    </div>

                    {isAiRecommended && (
                      <div className="absolute top-3 left-3 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {lang === 'ar' ? 'موصى به بذكاء' : 'AI Recommended'}
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900">{lang === 'ar' ? tmpl.nameAr : tmpl.nameEn}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {getCategoryLabel(tmpl.category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {lang === 'ar' ? tmpl.descriptionAr : tmpl.descriptionEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* AI Designer Tab */
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-sky-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 w-12 h-12 opacity-10 rotate-12" />
              <Wand2 className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-2">{lang === 'ar' ? '✨ دع Kayan AI يصمم سيرتك' : '✨ Let Kayan AI Design Your CV'}</h3>
              <p className="text-sky-100 text-sm max-w-md mx-auto">
                {lang === 'ar' 
                  ? 'سيقوم الذكاء الاصطناعي بتحليل خبراتك واختيار أفضل الألوان، الخطوط، وتوزيع الأقسام بما يناسب تخصصك.' 
                  : 'AI will analyze your experience and choose the best colors, fonts, and layout tailored to your profession.'}
              </p>
            </div>

            <form onSubmit={handleAiSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'المجال المهني' : 'Professional Field'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Engineering, Sales, Healthcare"
                    value={aiField}
                    onChange={(e) => setAiField(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'الوظيفة المستهدفة' : 'Target Job'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Project Manager"
                    value={aiTargetJob}
                    onChange={(e) => setAiTargetJob(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'مستوى الخبرة' : 'Experience Level'}
                  </label>
                  <select 
                    value={aiExpLevel}
                    onChange={(e) => setAiExpLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  >
                    <option value="entry">{lang === 'ar' ? 'خريج جديد / مبتدئ' : 'Entry Level / Graduate'}</option>
                    <option value="mid">{lang === 'ar' ? 'متوسط الخبرة' : 'Mid-Level'}</option>
                    <option value="senior">{lang === 'ar' ? 'خبير / سنير' : 'Senior / Expert'}</option>
                    <option value="executive">{lang === 'ar' ? 'قيادي / تنفيذي' : 'Executive / Leadership'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'النمط المفضل' : 'Preferred Style'}
                  </label>
                  <select 
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  >
                    <option value="modern">{lang === 'ar' ? 'عصري (Modern)' : 'Modern'}</option>
                    <option value="classic">{lang === 'ar' ? 'كلاسيكي رسمي' : 'Classic / Formal'}</option>
                    <option value="minimal">{lang === 'ar' ? 'بسيط (Minimal)' : 'Minimalist'}</option>
                    <option value="creative">{lang === 'ar' ? 'إبداعي (Creative)' : 'Creative'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-sky-200 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {lang === 'ar' ? 'ابدأ التصميم الذكي الآن' : 'Start AI Design Now'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      {fullPreviewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setFullPreviewTemplate(null)} />
          
          <div className="relative bg-white w-full max-w-6xl h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <h3 className="text-lg font-black text-slate-900">
                  {lang === 'ar' ? 'معاينة القالب الكاملة' : 'Full Template Preview'}
                </h3>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setPreviewLang('ar')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${previewLang === 'ar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    العربية
                  </button>
                  <button 
                    onClick={() => setPreviewLang('en')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${previewLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                  <button onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))} className="p-1 hover:bg-white rounded transition-all"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
                  <span className="text-xs font-mono font-bold text-slate-700 min-w-[3rem] text-center">{Math.round(previewScale * 100)}%</span>
                  <button onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))} className="p-1 hover:bg-white rounded transition-all"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
                </div>
                <button 
                  onClick={() => {
                    console.log('[CV TEMPLATE DEBUG] selected template (modal):', fullPreviewTemplate);
                    onSelect(fullPreviewTemplate);
                    setFullPreviewTemplate(null);
                  }}
                  className="bg-sky-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-sky-700 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {lang === 'ar' ? 'استخدام هذا القالب' : 'Use this Template'}
                </button>
                <button 
                  onClick={() => setFullPreviewTemplate(null)}
                  className="text-slate-400 hover:text-slate-900 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-auto bg-slate-200/50 p-10 flex justify-center items-start pattern-grid-slate-200">
              <div 
                className="transition-transform duration-300 origin-top shadow-2xl bg-white ring-1 ring-slate-900/5"
                style={{ transform: `scale(${previewScale})` }}
              >
                <CVPreview 
                  cv={getDemoCv(fullPreviewTemplate, previewLang)} 
                  scale={1} 
                />
              </div>
            </div>

            {/* Modal Footer Nav */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><Layout className="w-3.5 h-3.5" /> A4 Layout</span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Multi-language Support</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Ready</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Kayan CV Design Studio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

