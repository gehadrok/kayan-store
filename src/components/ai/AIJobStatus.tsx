import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { AIJobStatus as AIJobStatusType } from '../../types.ts';

interface AIJobStatusProps {
  status: AIJobStatusType | 'idle';
  error?: string;
  className?: string;
}

export const AIJobStatus: React.FC<AIJobStatusProps> = ({ status, error, className = '' }) => {
  if (status === 'queued') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold ${className}`}>
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>في الانتظار (Queued)...</span>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>جاري المعالجة بالذكاء الاصطناعي (Processing)...</span>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>اكتملت المهمة بنجاح (Completed)</span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>فشلت المهمة: {error || 'حدث خطأ أثناء المعالجة'}</span>
      </div>
    );
  }

  return null;
};
