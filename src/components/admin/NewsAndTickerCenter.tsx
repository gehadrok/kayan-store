import React, { useState } from 'react';
import { Newspaper, Megaphone, Globe, Settings, Activity } from 'lucide-react';
import { NewsAdminSection } from './NewsAdminSection.tsx';
import { AnnouncementsAdminSection } from './AnnouncementsAdminSection.tsx';

interface NewsAndTickerCenterProps {
  token: string | null;
  initialTab?: 'news' | 'ticker';
}

export const NewsAndTickerCenter: React.FC<NewsAndTickerCenterProps> = ({ token, initialTab = 'news' }) => {
  const [activeCenterTab, setActiveCenterTab] = useState<'news' | 'ticker'>(initialTab);

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      
      {/* Center Header & Main Sub-tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                📰
              </span>
              مركز إدارة الأخبار وشريط الأخبار (News & News Ticker Center)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              إدارة الأخبار الحقيقية المجلوبة تلقائياً، والتحكم بالكامل في شريط الأخبار والإعلانات في أعلى الموقع.
            </p>
          </div>
        </div>

        {/* Main 2 Sub-tabs */}
        <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveCenterTab('news')}
            className={`flex-1 py-3 px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeCenterTab === 'news'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-500/40 scale-[1.01]'
                : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>1. إدارة الأخبار الحقيقية (News Management)</span>
          </button>

          <button
            onClick={() => setActiveCenterTab('ticker')}
            className={`flex-1 py-3 px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeCenterTab === 'ticker'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-500/40 scale-[1.01]'
                : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>2. إدارة شريط الأخبار والإعلانات (News Ticker Management)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: News Articles & Sources Management */}
      {activeCenterTab === 'news' && (
        <NewsAdminSection
          token={token}
          onSwitchToTickerTab={() => setActiveCenterTab('ticker')}
        />
      )}

      {/* Tab 2: News Ticker / Store Announcements Management */}
      {activeCenterTab === 'ticker' && (
        <AnnouncementsAdminSection token={token} />
      )}

    </div>
  );
};
