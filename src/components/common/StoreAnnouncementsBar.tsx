import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Tag, AlertCircle, ChevronLeft, ChevronRight, X, ExternalLink, Flame } from 'lucide-react';
import type { Announcement } from '../../types.ts';

interface StoreAnnouncementsBarProps {
  onNavigate?: (path: string) => void;
  overrideSpeed?: number;
  overrideHeight?: number;
}

export const StoreAnnouncementsBar: React.FC<StoreAnnouncementsBarProps> = ({ 
  onNavigate, 
  overrideSpeed,
  overrideHeight 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickerSpeed, setTickerSpeed] = useState<number>(35);
  const [tickerHeight, setTickerHeight] = useState<number>(40);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
      if (typeof data.tickerSpeed === 'number') {
        setTickerSpeed(data.tickerSpeed);
      }
      if (typeof data.tickerHeight === 'number') {
        setTickerHeight(data.tickerHeight);
      }
    } catch (err) {
      console.error('Failed to fetch store announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));
  const activeSpeed = overrideSpeed || tickerSpeed || 35;
  const activeHeight = overrideHeight || tickerHeight || 40;
  
  // Calculate responsive font size based on height
  const baseFontSize = Math.max(11, Math.min(16, activeHeight * 0.35));

  if (loading || activeAnnouncements.length === 0) {
    return null;
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => [...prev, id]);
  };

  const handleClick = (ann: Announcement) => {
    let target = ann.link;
    if (ann.productId) {
      target = `/products/${ann.productId}`;
    }
    if (!target) return;

    if (target.startsWith('http')) {
      window.open(target, '_blank');
    } else if (onNavigate) {
      onNavigate(target);
    } else {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white';
      case 'new_product':
        return 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white';
      case 'update':
        return 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white';
      case 'promo':
        return 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white';
      default:
        return 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700 text-slate-100';
    }
  };

  const getIcon = (type: string, iconName?: string) => {
    if (iconName === 'Sparkles') return <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />;
    if (iconName === 'FileText') return <FileText className="w-4 h-4 text-sky-300" />;
    switch (type) {
      case 'discount': return <Tag className="w-4 h-4 text-amber-200" />;
      case 'new_product': return <Flame className="w-4 h-4 text-orange-300" />;
      case 'update': return <Sparkles className="w-4 h-4 text-emerald-200" />;
      default: return <Sparkles className="w-4 h-4 text-sky-300" />;
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden transition-all duration-500 shadow-md ${getTypeStyles(activeAnnouncements[0]?.type || 'info')}`}
      style={{ height: `${activeHeight}px` }}
    >
      <div className="h-full flex items-center">
        <div 
          className={`flex items-center gap-12 whitespace-nowrap animate-marquee ${isPaused ? '[animation-play-state:paused]' : ''}`}
          style={{ 
            animationDuration: `${activeSpeed}s`,
            animationTimingFunction: 'linear',
            fontSize: `${baseFontSize}px`
          }}
        >
          {/* Double for seamless loop (translateX -50% logic) */}
          {[...activeAnnouncements, ...activeAnnouncements].map((ann, idx) => (
            <div 
              key={`${ann.id}-${idx}`}
              onClick={() => handleClick(ann)}
              className="flex items-center gap-4 cursor-pointer group hover:text-sky-200 transition-colors px-4"
            >
              <div className="bg-white/10 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                {getIcon(ann.type, ann.icon)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black whitespace-nowrap">{ann.title}</span>
                <span className="opacity-80 whitespace-nowrap">— {ann.message}</span>
              </div>
              {(ann.link || ann.productId) && (
                <span className="bg-white/20 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                  اعرف المزيد <ExternalLink className="w-2.5 h-2.5" />
                </span>
              )}
              {/* Separator dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 mx-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
