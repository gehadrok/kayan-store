import React, { useState } from 'react';
import { History, FileText, Image as ImageIcon, Code, Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import type { AIJob } from '../../types.ts';

interface AIHistoryTableProps {
  jobs: AIJob[];
  isLoading?: boolean;
  onSelectJob?: (job: AIJob) => void;
}

export const AIHistoryTable: React.FC<AIHistoryTableProps> = ({ jobs, isLoading, onSelectJob }) => {
  const [capabilityFilter, setCapabilityFilter] = useState<'ALL' | 'text' | 'image' | 'code'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'failed'>('ALL');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">جاري تحميل سجل عمليات ومهمات الذكاء الاصطناعي...</p>
      </div>
    );
  }

  const filteredJobs = jobs.filter((j) => {
    if (capabilityFilter !== 'ALL' && j.type !== capabilityFilter) return false;
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    return true;
  });

  if (jobs.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
        <History className="w-12 h-12 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-white">لا يملك هذا المشروع سجل عمليات سابقة حتى الآن</h4>
        <p className="text-xs text-slate-400">انتقل إلى علامة التبويب "التوليد والإنشاء" لإطلاق أول مهمة بالذكاء الاصطناعي.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white">سجل العمليات والطلبات ({jobs.length})</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Capability Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setCapabilityFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${capabilityFilter === 'ALL' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setCapabilityFilter('text')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${capabilityFilter === 'text' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>نص</span>
            </button>
            <button
              onClick={() => setCapabilityFilter('image')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${capabilityFilter === 'image' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>صورة</span>
            </button>
            <button
              onClick={() => setCapabilityFilter('code')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${capabilityFilter === 'code' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>كود</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${statusFilter === 'ALL' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              جميع الحالات
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${statusFilter === 'completed' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ناجحة</span>
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${statusFilter === 'failed' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>فاشلة</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const isCompleted = job.status === 'completed';
          const isFailed = job.status === 'failed';

          let CapIcon = FileText;
          if (job.type === 'image') CapIcon = ImageIcon;
          if (job.type === 'code') CapIcon = Code;

          return (
            <div
              key={job.id}
              onClick={() => onSelectJob?.(job)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400 border border-slate-700">
                    <CapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase">{job.type}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {job.model}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(job.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>

                <div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ناجحة</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>فشلت</span>
                    </span>
                  )}
                  {!isCompleted && !isFailed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      <span>قيد المعالجة</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                  <span className="text-slate-500 font-bold ml-1">التوجيه:</span>
                  {job.prompt}
                </p>
                {isFailed && job.error && (
                  <p className="text-[11px] text-rose-400 mt-2 pt-2 border-t border-slate-800 font-sans">
                    <span className="font-bold">سبب الفشل:</span> {job.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
