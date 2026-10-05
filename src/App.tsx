import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { UserAuthProvider } from './context/UserAuthContext.tsx';
import { Application, Release } from './types.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { DownloadModal } from './components/common/DownloadModal.tsx';
import { StoreAnnouncementsBar } from './components/common/StoreAnnouncementsBar.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { ProductCatalogPage } from './pages/products/CatalogPage.tsx';
import { ProductDetailsPage } from './pages/products/ProductDetailsPage.tsx';
import { AppDetailsPage } from './pages/AppDetailsPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';
import { LicensesPage } from './pages/LicensesPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { AccountPage } from './pages/account/AccountPage.tsx';
import { AIWorkspacePage } from './pages/ai/AIWorkspacePage.tsx';
import { AIDocumentsListPage } from './pages/ai/AIDocumentsListPage.tsx';
import { AIDocumentDetailPage } from './pages/ai/AIDocumentDetailPage.tsx';
import { AppBuilderPage } from './pages/ai/AppBuilderPage.tsx';
import { NewsSection } from './components/news/NewsSection.tsx';
import { NewsDetailPage } from './pages/news/NewsDetailPage.tsx';
import { CVHubPage } from './pages/cv/CVHubPage.tsx';
import { CVEditorPage } from './pages/cv/CVEditorPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

export function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Download Modal global state
  const [downloadModalApp, setDownloadModalApp] = useState<Application | null>(null);
  const [downloadModalRelease, setDownloadModalRelease] = useState<Release | undefined>(undefined);

  // Fetch published applications on load
  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      if (data.success && Array.isArray(data.apps)) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error('Failed to load apps from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handler
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Download Modal
  const handleOpenDownload = (app: Application, release?: Release) => {
    setDownloadModalApp(app);
    setDownloadModalRelease(release);
  };

  // Close Download Modal
  const handleCloseDownload = () => {
    setDownloadModalApp(null);
    setDownloadModalRelease(undefined);
  };

  // Route Resolver
  const renderRoute = () => {
    if (currentPath === '/' || currentPath === '') {
      return (
        <HomePage
          apps={apps}
          onNavigate={navigate}
          onDownloadClick={handleOpenDownload}
        />
      );
    }

    if (currentPath === '/apps') {
      return (
        <CatalogPage
          apps={apps}
          onNavigate={navigate}
          onDownloadClick={handleOpenDownload}
        />
      );
    }

    if (currentPath === '/products') {
      return <ProductCatalogPage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/products/')) {
      const slug = currentPath.replace('/products/', '').split('/')[0];
      return <ProductDetailsPage slug={slug} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/apps/')) {
      const slug = currentPath.replace('/apps/', '').split('/')[0];
      return (
        <AppDetailsPage
          slug={slug}
          onNavigate={navigate}
          onDownloadClick={handleOpenDownload}
        />
      );
    }

    if (currentPath === '/privacy') {
      return <PrivacyPage />;
    }

    if (currentPath === '/terms') {
      return <TermsPage />;
    }

    if (currentPath === '/licenses') {
      return <LicensesPage />;
    }

    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }

    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }

    if (currentPath === '/account') {
      return <AccountPage onNavigate={navigate} defaultTab="profile" />;
    }

    if (currentPath === '/library') {
      return <AccountPage onNavigate={navigate} defaultTab="library" />;
    }

    if (currentPath === '/favorites') {
      return <AccountPage onNavigate={navigate} defaultTab="favorites" />;
    }

    if (currentPath.startsWith('/ai/documents/')) {
      const docId = currentPath.replace('/ai/documents/', '').split('/')[0];
      return <AIDocumentDetailPage documentId={docId} onNavigate={navigate} />;
    }

    if (currentPath === '/ai/documents') {
      return <AIDocumentsListPage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/news/')) {
      const articleId = currentPath.replace('/news/', '').split('/')[0];
      if (articleId && articleId !== 'news') {
        return <NewsDetailPage articleId={articleId} onNavigate={navigate} />;
      }
    }

    if (currentPath === '/news' || currentPath.startsWith('/news?')) {
      return <NewsSection onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/cv/')) {
      const cvId = currentPath.replace('/cv/', '').split('/')[0];
      if (cvId) {
        return <CVEditorPage cvId={cvId} onNavigate={navigate} />;
      }
    }

    if (currentPath === '/cv' || currentPath.startsWith('/cv?')) {
      return <CVHubPage onNavigate={navigate} />;
    }

    if (currentPath === '/ai' || currentPath.startsWith('/ai')) {
      return <AIWorkspacePage onNavigate={navigate} />;
    }

    if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
      return <AdminDashboard onNavigate={navigate} />;
    }

    // 404 Fallback
    return <NotFoundPage onNavigate={navigate} />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-sky-500/20 selection:text-sky-900">
      
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Kayan PDF",
            "operatingSystem": "Android 7.0+",
            "applicationCategory": "ProductivityApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "المهندس جهاد الصليحي"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Kayan Soft",
              "url": window.location.origin
            }
          })
        }}
      />

      {/* Store Dynamic Announcements Bar */}
      <StoreAnnouncementsBar onNavigate={navigate} />

      {/* Navigation Header */}
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderRoute()}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={navigate} />

      {/* APK Download Confirmation Modal */}
      {downloadModalApp && (
        <DownloadModal
          isOpen={!!downloadModalApp}
          onClose={handleCloseDownload}
          app={downloadModalApp}
          release={downloadModalRelease}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <UserAuthProvider>
          <AppContent />
        </UserAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
