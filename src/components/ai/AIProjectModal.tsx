import React, { useState } from 'react';
import { FolderPlus, X, Sparkles, Code2, FileText, Image as ImageIcon, Briefcase } from 'lucide-react';
import type { AIProject } from '../../types.ts';

interface AIProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description: string, type: string) => Promise<AIProject | null>;
}

export const AIProjectModal: React.FC<AIProjectModalProps> = ({ isOpen, onClose, onCreateProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('اسم المشروع يجب أن يحتوي على حرفين على الأقل');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await onCreateProject(name.trim(), description.trim(), type);
      if (created) {
        setName('');
        setDescription('');
        setType('GENERAL');
        onClose();
      } else {
        setError('فشل في إنشاء المشروع. يرجى إعادة المحاولة.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إنشاء المشروع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectTypes = [
    { id: 'GENERAL', label: 'عام / متعدد الاستخدامات', icon: Sparkles, desc: 'مشروع شامل للنصوص والصور والكود' },
    { id: 'DEVELOPMENT', label: 'برمجة وتطوير', icon: Code2, desc: 'توليد مكونات وبرمجيات وتطبيقات' },
    { id: 'CONTENT', label: 'كتابة ومحتوى', icon: FileText, desc: 'توليد المقالات والنصوص التسويقية' },
    { id: 'DESIGN', label: 'تصميم وجرافيك', icon: ImageIcon, desc: 'توليد الصور والشعارات والواجهات' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">إنشاء مشروع Kayan AI جديد</h3>
            <p className="text-xs text-slate-400 mt-0.5">خصص مساحة عمل لتنظيم التوجيهات والأصول والمهام المتولدة</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المشروع <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تطبيق متجر إلكتروني أو نظام إدارة المحتوى"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف المشروع (اختياري)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً موجزاً للهدف من هذا المشروع..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">نوع المشروع</label>
            <div className="grid grid-cols-2 gap-2.5">
              {projectTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{t.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-600/20"
            >
              {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
