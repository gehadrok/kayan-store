import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Download, Globe, Shield, Menu, X, Layers, ArrowLeft, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { lang, dir, toggleLang, t } = useLanguage();
  const { admin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/apps', label: t('nav.apps') },
    { path: '/about', label: t('nav.about') },
    { path: '/privacy', label: t('nav.privacy') },
    { path: '/terms', label: t('nav.terms') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNav('/')}
            className="group flex items-center gap-2.5 text-start focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                {lang === 'ar' ? 'متجر كيان' : 'Kayan Store'}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {lang === 'ar' ? 'كيان سوفت' : 'Kayan Soft'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-6 Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map(link => {
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`transition-colors hover:text-sky-600 relative py-1 ${
                  isActive ? 'font-semibold text-sky-600' : 'text-slate-600'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 start-0 h-0.5 w-full rounded-full bg-sky-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary actions & Language toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none"
            title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span>{t('common.language')}</span>
          </button>

          {/* Admin link */}
          <button
            onClick={() => handleNav('/admin')}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              currentPath === '/admin'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-sky-500" />
            <span>{admin ? (lang === 'ar' ? 'لوحة التحكم' : 'Admin') : (lang === 'ar' ? 'دخول المسؤول' : 'Admin Login')}</span>
          </button>

          {/* Catalog CTA */}
          <button
            onClick={() => handleNav('/apps')}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('nav.apps')}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-start ${
                    isActive ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {dir === 'rtl' ? (
                    <ArrowLeft className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => handleNav('/admin')}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 text-start"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-sky-600" />
                  <span>{t('nav.admin')}</span>
                </div>
                <span className="text-xs text-slate-400">{admin ? 'نشط' : 'دخول'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
