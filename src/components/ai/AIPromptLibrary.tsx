import React, { useState } from 'react';
import { Sparkles, Copy, Check, Bookmark, BookOpen, Code, Image as ImageIcon, FileText } from 'lucide-react';

interface AIPromptLibraryProps {
  onSelectPrompt: (promptText: string, capability: 'TEXT' | 'IMAGE' | 'CODE') => void;
}

interface PromptTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'TEXT' | 'IMAGE' | 'CODE';
  promptAr: string;
  promptEn: string;
}

export const AIPromptLibrary: React.FC<AIPromptLibraryProps> = ({ onSelectPrompt }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'CODE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const templates: PromptTemplate[] = [
    {
      id: 'pt_code_react',
      titleAr: 'مكون React كامل مع Tailwind',
      titleEn: 'React Component with Tailwind CSS',
      category: 'CODE',
      promptAr: 'أنشئ بطاقة منتج تفاعلية بلغة TypeScript لمكتبة React تستخدم Tailwind CSS مع زر إضافة للمفضلة وزر الشراء وحساب الخصم تلقائياً.',
      promptEn: 'Create an interactive product card component in React + TypeScript using Tailwind CSS with add-to-favorites button, buy button, and automatic discount calculation.'
    },
    {
      id: 'pt_code_express',
      titleAr: 'مسار Express REST API آمن',
      titleEn: 'Secure Express REST API Route',
      category: 'CODE',
      promptAr: 'اكتب مسار API لـ Node.js/Express يتعامل مع تسجيل دخول المستخدمين، والتحقق من كلمة المرور مع bcrypt، وإعادة توكن الجلسة الآمن مع معالجة الأخطاء القياسية.',
      promptEn: 'Write a Node.js/Express API route for user authentication with bcrypt password verification, session token generation, and standardized error handling.'
    },
    {
      id: 'pt_text_article',
      titleAr: 'مقال تقني احترافي متوافق مع SEO',
      titleEn: 'SEO Optimized Tech Article',
      category: 'TEXT',
      promptAr: 'اكتب مقالاً تقنياً احترافياً متوافقاً مع SEO عن أهمية المعالجة المحلية للبيانات وحماية الخصوصية في تطبيقات الهواتف الذكية مع النقاط الرئيسية والعناوين الفرعية.',
      promptEn: 'Write an SEO-optimized professional tech article discussing local data processing and privacy protection in smartphone applications with key takeaways and subtitles.'
    },
    {
      id: 'pt_text_summary',
      titleAr: 'ملخص متطلبات واستراتيجية تنفيذ',
      titleEn: 'Requirements Summary & Execution Plan',
      category: 'TEXT',
      promptAr: 'قم بإنشاء ملخص احترافي لمتطلبات المشروع التقني المقترح مرتباً في 4 نقاط رئيسية: الأهداف، المعمارية، المخاطر الأمنية، وجدول التنفيذ الزمني.',
      promptEn: 'Create a professional tech project proposal summary organized into 4 key sections: Objectives, Architecture, Security Risks, and Timeline.'
    },
    {
      id: 'pt_img_app_icon',
      titleAr: 'شعار أيقونة تطبيق أندرويد عصري',
      titleEn: 'Modern Android App Icon Logo',
      category: 'IMAGE',
      promptAr: 'A sleek modern minimal technology app icon logo for Kayan Store, dark mode background, glowing neon blue gradients, 8k resolution, isometric high tech vector style',
      promptEn: 'A sleek modern minimal technology app icon logo for Kayan Store, dark mode background, glowing neon blue gradients, 8k resolution, isometric high tech vector style'
    },
    {
      id: 'pt_img_hero',
      titleAr: 'صورة غلاف تقنية لمنصة رقمية',
      titleEn: 'Digital Platform Tech Hero Banner',
      category: 'IMAGE',
      promptAr: 'A futuristic tech hero banner background depicting artificial intelligence neural networks, deep midnight blue palette, glowing cyan lines, cinematic lighting, 16:9 ratio',
      promptEn: 'A futuristic tech hero banner background depicting artificial intelligence neural networks, deep midnight blue palette, glowing cyan lines, cinematic lighting, 16:9 ratio'
    }
  ];

  const filtered = templates.filter(t => activeCategory === 'ALL' || t.category === activeCategory);

  const handleCopy = (t: PromptTemplate) => {
    navigator.clipboard.writeText(t.promptAr);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white">مكتبة التوجيهات الجاهزة (Prompt Library)</h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeCategory === 'ALL' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            الكل ({templates.length})
          </button>
          <button
            onClick={() => setActiveCategory('TEXT')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeCategory === 'TEXT' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>نص</span>
          </button>
          <button
            onClick={() => setActiveCategory('IMAGE')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeCategory === 'IMAGE' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>صورة</span>
          </button>
          <button
            onClick={() => setActiveCategory('CODE')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeCategory === 'CODE' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>كود</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const isCopied = copiedId === t.id;
          return (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    {t.titleAr}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {t.promptAr}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleCopy(t)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isCopied ? 'تم النسخ' : 'نسخ التوجيه'}</span>
                </button>
                <button
                  onClick={() => onSelectPrompt(t.promptAr, t.category)}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-[11px] font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <span>استخدام في المحرر</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
