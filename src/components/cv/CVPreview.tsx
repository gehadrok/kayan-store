import React from 'react';
import { UserCV, CVDesignSpecification, TEMPLATE_REGISTRY } from '../../types/cv.ts';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink, Sparkles } from 'lucide-react';

interface CVPreviewProps {
  cv: UserCV;
  lang?: 'ar' | 'en';
  scale?: number;
  showPageMarkers?: boolean;
}

export const CVPreview: React.FC<CVPreviewProps> = ({ cv, lang, scale = 1, showPageMarkers = true }) => {
  const defaultDesign: CVDesignSpecification = {
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

  const templateDefaults = TEMPLATE_REGISTRY.find((t: any) => t.id === cv.template)?.defaultDesignSpec || {};

  const design = {
    ...defaultDesign,
    ...templateDefaults,
    ...(cv.designSpec || {})
  };

  // Ensure sectionOrder is always an array to prevent crashes
  const sectionOrder = Array.isArray(design.sectionOrder) && design.sectionOrder.length > 0 
    ? design.sectionOrder 
    : defaultDesign.sectionOrder;

  const previewLang = lang || cv.language;
  const isRtl = previewLang === 'ar';
  const t = (ar: string, en: string) => (previewLang === 'ar' ? ar : en);

  console.log('[CV TEMPLATE DEBUG] renderer template:', cv.template);
  console.log('[CV TEMPLATE DEBUG] sections:', sectionOrder);
  console.log('[CV TEMPLATE DEBUG] experiences count:', cv.experiences?.length || 0);

  // Layout-specific styles for scaling
  const scaleStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: isRtl ? 'top right' : 'top left',
    width: '210mm',
    minHeight: '297mm',
  };

  const containerStyle: React.CSSProperties = {
    width: `${210 * scale}mm`,
    // Removed fixed height to allow multiple pages
    minHeight: `${297 * scale}mm`,
    overflow: 'visible', // Changed from hidden to allow multi-page flow
    position: 'relative'
  };

  // Font Family mapping
  const getFontFamily = (font: string) => {
    switch (font) {
      case 'serif': return '"Times New Roman", Times, serif';
      case 'mono': return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      case 'inter': return '"Inter", sans-serif';
      case 'cormorant': return '"Cormorant Garamond", serif';
      default: return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
  };

  const fontClass = getFontFamily(design.fontFamily);

  // Template-specific styling overrides
  const getTemplateBaseStyles = () => {
    switch (cv.template) {
      case 'tech':
        return { 
          fontFamily: getFontFamily('mono'),
          borderTop: `8px solid ${design.primaryColor}`
        };
      case 'executive':
        return {
          fontFamily: getFontFamily('cormorant'),
          padding: '20mm'
        };
      case 'ats_friendly':
        return {
          fontFamily: getFontFamily('inter'),
          padding: '15mm',
          backgroundColor: '#fff'
        };
      default:
        return { fontFamily: fontClass };
    }
  };

  const sizeClass = ({
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  } as Record<string, string>)[design.fontSize] || 'text-xs';

  const spacingClass = ({
    compact: 'space-y-2',
    normal: 'space-y-4',
    spacious: 'space-y-7'
  } as Record<string, string>)[design.spacing] || 'space-y-4';

  const densityPadding = ({
    compact: 'p-8',
    normal: 'p-12',
    spacious: 'p-16'
  } as Record<string, string>)[design.contentDensity] || 'p-12';

  // Section Rendering
  const renderSummary = () => (
    cv.summary && (
      <section key="summary" className="mb-4 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-2" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('النبذة المهنية', 'Professional Summary')}
        </h2>
        <p className={`${sizeClass} text-slate-700 leading-relaxed whitespace-pre-wrap text-justify`}>{cv.summary}</p>
      </section>
    )
  );

  const renderExperience = () => (
    (cv.experiences && cv.experiences.length > 0) && (
      <section key="experience" className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-4" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('الخبرات المهنية', 'Work Experience')}
        </h2>
        <div className="space-y-6">
          {cv.experiences.map(exp => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                <h3 className="text-sm font-black" style={{ color: design.headingColor }}>
                  {exp.position} <span className="mx-1 text-slate-300 font-normal">|</span> <span style={{ color: design.primaryColor }}>{exp.company}</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                  {exp.startDate} — {exp.current ? t('الآن', 'Present') : exp.endDate}
                </span>
              </div>
              {exp.location && <p className="text-[10px] text-slate-500 mb-2 italic">{exp.location}</p>}
              <p className={`${sizeClass} text-slate-600 leading-relaxed whitespace-pre-wrap`}>{exp.description}</p>
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderEducation = () => (
    (cv.education && cv.education.length > 0) && (
      <section key="education" className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-4" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('التعليم الأكاديمي', 'Education')}
        </h2>
        <div className="space-y-4">
          {cv.education.map(edu => (
            <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between break-inside-avoid">
              <div>
                <h3 className="text-sm font-black" style={{ color: design.headingColor }}>
                  {edu.degree} {edu.field ? t(` في ${edu.field}`, ` in ${edu.field}`) : ''}
                </h3>
                <p className="text-xs text-slate-600">{edu.institution} {edu.location ? `· ${edu.location}` : ''}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{edu.endDate}</span>
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderSkills = () => (
    (cv.skills && cv.skills.length > 0) && (
      <section key="skills" className="mb-6 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 pb-1 mb-4" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('المهارات', 'Skills')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {cv.skills.map(skill => (
            <div 
              key={skill.id} 
              className="flex flex-col gap-1"
            >
              <span className="inline-block rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-800 border border-slate-200 shadow-xs">
                {skill.name}
              </span>
              {skill.level && (
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      backgroundColor: design.primaryColor,
                      width: skill.level === 'expert' ? '100%' : skill.level === 'advanced' ? '80%' : skill.level === 'intermediate' ? '60%' : '40%'
                    }} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderProjects = () => (
    (cv.projects && cv.projects.length > 0) && (
      <section key="projects" className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-4" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('المشاريع', 'Projects')}
        </h2>
        <div className="space-y-4">
          {cv.projects.map(proj => (
            <div key={proj.id} className="break-inside-avoid">
              <h3 className="text-sm font-black mb-1" style={{ color: design.headingColor }}>{proj.title}</h3>
              {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 hover:underline mb-1 flex items-center gap-1"><ExternalLink className="w-3 h-3"/> {proj.url}</a>}
              <p className={`${sizeClass} text-slate-600 leading-relaxed whitespace-pre-wrap`}>{proj.description}</p>
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {proj.technologies.map((tech, i) => <span key={i} className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{tech}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderCertificates = () => (
    (cv.certificates && cv.certificates.length > 0) && (
      <section key="certificates" className="mb-4 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('الشهادات والدورات', 'Certificates')}
        </h2>
        <div className="space-y-3">
          {cv.certificates.map(cert => (
            <div key={cert.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-xs font-black" style={{ color: design.headingColor }}>{cert.name}</h4>
                <p className="text-[10px] text-slate-500">{cert.issuer}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{cert.date}</span>
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderLanguages = () => (
    (cv.languages && cv.languages.length > 0) && (
      <section key="languages" className="mb-6 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 pb-1 mb-4" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('اللغات', 'Languages')}
        </h2>
        <div className="space-y-3">
          {cv.languages.map(langItem => (
            <div key={langItem.id} className="flex items-center justify-between text-xs group">
              <span className="font-bold text-slate-700">{langItem.name}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(dot => {
                  const levelMap: Record<string, number> = { native: 5, fluent: 5, advanced: 4, intermediate: 3, basic: 2 };
                  const currentLevel = levelMap[langItem.proficiency] || 1;
                  return (
                    <div 
                      key={dot} 
                      className={`w-2 h-2 rounded-full transition-colors duration-500 ${dot <= currentLevel ? '' : 'bg-slate-200'}`}
                      style={dot <= currentLevel ? { backgroundColor: design.primaryColor } : {}}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  );

  const renderLinks = () => (
    (cv.links && cv.links.length > 0) && (
      <section key="links" className="mb-4 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1 mb-2" style={{ color: design.headingColor, borderColor: design.primaryColor }}>
          {t('روابط إضافية', 'Additional Links')}
        </h2>
        <div className="flex flex-wrap gap-4">
          {cv.links.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>{link.platform || link.url}</span>
            </a>
          ))}
        </div>
      </section>
    )
  );

  const renderSectionById = (id: string) => {
    if (design.hiddenSections && design.hiddenSections.includes(id)) return null;
    switch (id) {
      case 'summary': return renderSummary();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'skills': return renderSkills();
      case 'projects': return renderProjects();
      case 'certificates': return renderCertificates();
      case 'languages': return renderLanguages();
      case 'links': return renderLinks();
      default: return null;
    }
  };

  const renderHeader = () => {
    const photoUrl = cv.personalInfo.photoUrl;
    const hasPhoto = design.photoSize && design.photoSize !== 'none' && photoUrl;
    const photoSizePx = {
      small: 80,
      medium: 120,
      large: 160
    }[design.photoSize as string] || 120;

    const PhotoBox = () => (
      hasPhoto ? (
        <div 
          className="shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg bg-slate-100"
          style={{ width: `${photoSizePx}px`, height: `${photoSizePx}px` }}
        >
          <img src={photoUrl} alt={cv.personalInfo.fullName} className="w-full h-full object-cover" />
        </div>
      ) : null
    );

    if (design.headerStyle === 'banner') {
      return (
        <header className="mb-8 overflow-hidden rounded-lg shadow-md flex flex-col sm:flex-row relative" style={{ backgroundColor: design.primaryColor }}>
          <div className="flex-1 p-8 text-white z-10 flex gap-6 items-center">
            <PhotoBox />
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                {cv.personalInfo.fullName || t('الاسم الكامل', 'Full Name')}
              </h1>
              <p className="text-xl font-medium opacity-90 border-t border-white/20 pt-2">
                {cv.personalInfo.headline || cv.targetJobTitle || t('المسمى الوظيفي', 'Professional Headline')}
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 flex flex-col justify-center gap-3 text-[10px] text-white/90 font-bold border-l border-white/10 min-w-[200px]">
            {cv.personalInfo.email && (
              <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {cv.personalInfo.email}</span>
            )}
            {cv.personalInfo.phone && (
              <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {cv.personalInfo.phone}</span>
            )}
            {cv.personalInfo.location && (
              <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {cv.personalInfo.location}</span>
            )}
            {cv.personalInfo.website && (
              <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {cv.personalInfo.website}</span>
            )}
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
        </header>
      );
    }

    if (design.headerStyle === 'split') {
      return (
        <header className="mb-8 grid grid-cols-12 gap-8 border-b-4 border-slate-900 pb-8 items-center">
          <div className="col-span-2">
            <PhotoBox />
          </div>
          <div className="col-span-7">
            <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase" style={{ color: design.headingColor }}>
              {cv.personalInfo.fullName || t('الاسم الكامل', 'Full Name')}
            </h1>
            <div className="h-2 w-20 mb-4" style={{ backgroundColor: design.primaryColor }} />
            <p className="text-xl font-black uppercase tracking-[0.2em]" style={{ color: design.primaryColor }}>
              {cv.personalInfo.headline || cv.targetJobTitle || t('المسمى الوظيفي', 'Professional Headline')}
            </p>
          </div>
          <div className="col-span-3 flex flex-col justify-center gap-2.5 text-xs text-slate-500 font-bold text-end">
            {cv.personalInfo.email && (
              <span className="flex items-center gap-2 justify-end">{cv.personalInfo.email} <Mail className="w-3.5 h-3.5 text-slate-400" /></span>
            )}
            {cv.personalInfo.phone && (
              <span className="flex items-center gap-2 justify-end">{cv.personalInfo.phone} <Phone className="w-3.5 h-3.5 text-slate-400" /></span>
            )}
            {cv.personalInfo.location && (
              <span className="flex items-center gap-2 justify-end">{cv.personalInfo.location} <MapPin className="w-3.5 h-3.5 text-slate-400" /></span>
            )}
          </div>
        </header>
      );
    }

    return (
      <header className={`border-b-4 pb-8 mb-8 ${design.headerStyle === 'centered' ? 'text-center' : 'text-start'}`} style={{ borderColor: design.primaryColor }}>
        <div className={`flex items-center gap-8 ${design.headerStyle === 'centered' ? 'flex-col' : 'flex-row'}`}>
          <PhotoBox />
          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: design.headingColor }}>
              {cv.personalInfo.fullName || t('الاسم الكامل', 'Full Name')}
            </h1>
            <p className="text-xl font-bold mb-6 tracking-wide" style={{ color: design.primaryColor }}>
              {cv.personalInfo.headline || cv.targetJobTitle || t('المسمى الوظيفي', 'Professional Headline')}
            </p>
            <div className={`flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] text-slate-500 font-black uppercase tracking-widest ${design.headerStyle === 'centered' ? 'justify-center' : 'justify-start'}`}>
              {cv.personalInfo.email && (
                <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {cv.personalInfo.email}</span>
              )}
              {cv.personalInfo.phone && (
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {cv.personalInfo.phone}</span>
              )}
              {cv.personalInfo.location && (
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {cv.personalInfo.location}</span>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div style={containerStyle} className="cv-preview-wrapper cv-print-document">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Hide all elements on the page except for the CV container */
          body > *:not(#root) {
            display: none !important;
          }
          #root > *:not(.cv-print-document) {
            display: none !important;
          }
          .cv-print-document {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }
          
          .cv-main-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            transform: none !important;
            overflow: visible !important;
          }
          
          /* Ensure content is visible */
          .cv-main-container * {
            display: block !important;
          }
          
          /* Specifically hide known platform elements */
          nav, footer, .navbar, .app-header, .editor-toolbar, .no-print {
            display: none !important;
          }
          
          /* Fix for grid layout in print */
          .grid {
            display: grid !important;
          }
        }
      `}} />
      <div 
        className={`bg-white shadow-2xl rounded-sm ${densityPadding} text-slate-900 relative print:shadow-none print:w-[210mm] print:p-0 min-h-[297mm] cv-main-container`} 
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ ...scaleStyle, ...getTemplateBaseStyles() }}
      >
        {/* Visual Page Break Markers - Generated every 297mm */}
        {showPageMarkers && [1, 2, 3, 4].map(page => (
          <div key={page} className="absolute left-0 w-full border-t-2 border-dashed border-slate-200 pointer-events-none print:hidden flex justify-center z-50" style={{ top: `${297 * page}mm` }}>
            <span className="bg-slate-100 text-[10px] text-slate-400 px-3 py-1 rounded-b uppercase font-black tracking-[0.3em] shadow-sm -mt-[1px]">
              {t(`نهاية الصفحة ${page}`, `End of Page ${page}`)}
            </span>
          </div>
        ))}

        {renderHeader()}

        {design.columns === 'two_column' ? (
          <div className="grid grid-cols-12 gap-10">
            {/* Main Column */}
            <div className="col-span-8">
              <div className={spacingClass}>
                {sectionOrder
                  .filter((id: string) => !['skills', 'languages', 'certificates', 'links'].includes(id))
                  .map((id: string) => renderSectionById(id))}
              </div>
            </div>
            {/* Sidebar Column */}
            <div className="col-span-4 space-y-8 border-l border-slate-100 pl-6 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-6">
              {sectionOrder
                .filter((id: string) => ['skills', 'languages', 'certificates', 'links'].includes(id))
                .map((id: string) => renderSectionById(id))}
            </div>
          </div>
        ) : (
          <div className={spacingClass}>
            {sectionOrder.map((id: string) => renderSectionById(id))}
          </div>
        )}
      </div>
    </div>
  );
};
