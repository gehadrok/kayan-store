import { UserCV, CVTemplateType, CVStatus, CVPersonalInfo, CVDesignSpecification } from '../../types/cv.ts';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: Partial<UserCV>;
}

export function validateCVInput(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  // Title validation
  const title = typeof body.title === 'string' ? body.title.trim() : 'سيرة ذاتية جديدة';
  if (title.length === 0 || title.length > 255) {
    return { valid: false, error: 'عنوان السيرة الذاتية مطلوب ويجب أن يكون أقل من 255 حرفاً' };
  }

  // Language validation
  const language = body.language === 'en' ? 'en' : 'ar';

  // Template validation (15 templates)
  const validTemplates: CVTemplateType[] = [
    'professional_classic', 'modern_professional', 'executive', 'tech', 'minimal',
    'ats_friendly', 'academic', 'administrative', 'creative', 'modern_elegant',
    'two_column', 'corporate_formal', 'graduate_entry', 'senior_experienced', 'creative_roles'
  ];
  // Backward compatibility fallback for legacy template names
  let templateInput = body.template;
  if (templateInput === 'professional') templateInput = 'professional_classic';
  if (templateInput === 'modern') templateInput = 'modern_professional';

  const template: CVTemplateType = validTemplates.includes(templateInput) ? templateInput : 'professional_classic';

  // Status validation
  const status: CVStatus = body.status === 'published' ? 'published' : 'draft';

  // IsPrimary validation
  const isPrimary = Boolean(body.isPrimary);

  // Personal Info validation
  const rawInfo = body.personalInfo || {};
  const personalInfo: CVPersonalInfo = {
    fullName: typeof rawInfo.fullName === 'string' ? rawInfo.fullName.trim().slice(0, 150) : '',
    email: typeof rawInfo.email === 'string' ? rawInfo.email.trim().slice(0, 150) : '',
    phone: typeof rawInfo.phone === 'string' ? rawInfo.phone.trim().slice(0, 50) : '',
    location: typeof rawInfo.location === 'string' ? rawInfo.location.trim().slice(0, 150) : '',
    headline: typeof rawInfo.headline === 'string' ? rawInfo.headline.trim().slice(0, 250) : '',
    photoUrl: typeof rawInfo.photoUrl === 'string' ? rawInfo.photoUrl.trim().slice(0, 500) : '',
    website: typeof rawInfo.website === 'string' ? rawInfo.website.trim().slice(0, 250) : '',
    linkedin: typeof rawInfo.linkedin === 'string' ? rawInfo.linkedin.trim().slice(0, 250) : '',
    github: typeof rawInfo.github === 'string' ? rawInfo.github.trim().slice(0, 250) : '',
    portfolio: typeof rawInfo.portfolio === 'string' ? rawInfo.portfolio.trim().slice(0, 250) : ''
  };

  if (!personalInfo.fullName) {
    return { valid: false, error: 'الاسم الكامل مطلوب في المعلومات الشخصية' };
  }

  // Summary validation
  const summary = typeof body.summary === 'string' ? body.summary.trim().slice(0, 3000) : '';

  // Experiences validation
  const experiences = Array.isArray(body.experiences) ? body.experiences.map((exp: any) => ({
    id: typeof exp.id === 'string' ? exp.id : Math.random().toString(36).substring(2, 9),
    company: typeof exp.company === 'string' ? exp.company.trim().slice(0, 150) : '',
    position: typeof exp.position === 'string' ? exp.position.trim().slice(0, 150) : '',
    location: typeof exp.location === 'string' ? exp.location.trim().slice(0, 100) : '',
    startDate: typeof exp.startDate === 'string' ? exp.startDate.trim().slice(0, 30) : '',
    endDate: typeof exp.endDate === 'string' ? exp.endDate.trim().slice(0, 30) : '',
    current: Boolean(exp.current),
    description: typeof exp.description === 'string' ? exp.description.trim().slice(0, 2000) : '',
    achievements: Array.isArray(exp.achievements) ? exp.achievements.map((a: any) => String(a).trim().slice(0, 300)) : []
  })) : [];

  // Education validation
  const education = Array.isArray(body.education) ? body.education.map((edu: any) => ({
    id: typeof edu.id === 'string' ? edu.id : Math.random().toString(36).substring(2, 9),
    institution: typeof edu.institution === 'string' ? edu.institution.trim().slice(0, 150) : '',
    degree: typeof edu.degree === 'string' ? edu.degree.trim().slice(0, 150) : '',
    field: typeof edu.field === 'string' ? edu.field.trim().slice(0, 150) : '',
    location: typeof edu.location === 'string' ? edu.location.trim().slice(0, 100) : '',
    startDate: typeof edu.startDate === 'string' ? edu.startDate.trim().slice(0, 30) : '',
    endDate: typeof edu.endDate === 'string' ? edu.endDate.trim().slice(0, 30) : '',
    current: Boolean(edu.current),
    grade: typeof edu.grade === 'string' ? edu.grade.trim().slice(0, 50) : ''
  })) : [];

  // Skills validation
  const skills = Array.isArray(body.skills) ? body.skills.map((s: any) => ({
    id: typeof s.id === 'string' ? s.id : Math.random().toString(36).substring(2, 9),
    name: typeof s.name === 'string' ? s.name.trim().slice(0, 100) : '',
    level: ['beginner', 'intermediate', 'advanced', 'expert'].includes(s.level) ? s.level : 'intermediate',
    category: typeof s.category === 'string' ? s.category.trim().slice(0, 100) : ''
  })) : [];

  // Projects validation
  const projects = Array.isArray(body.projects) ? body.projects.map((p: any) => ({
    id: typeof p.id === 'string' ? p.id : Math.random().toString(36).substring(2, 9),
    title: typeof p.title === 'string' ? p.title.trim().slice(0, 150) : '',
    description: typeof p.description === 'string' ? p.description.trim().slice(0, 1500) : '',
    url: typeof p.url === 'string' ? p.url.trim().slice(0, 250) : '',
    technologies: Array.isArray(p.technologies) ? p.technologies.map((t: any) => String(t).trim().slice(0, 50)) : []
  })) : [];

  // Certificates validation
  const certificates = Array.isArray(body.certificates) ? body.certificates.map((c: any) => ({
    id: typeof c.id === 'string' ? c.id : Math.random().toString(36).substring(2, 9),
    name: typeof c.name === 'string' ? c.name.trim().slice(0, 150) : '',
    issuer: typeof c.issuer === 'string' ? c.issuer.trim().slice(0, 150) : '',
    date: typeof c.date === 'string' ? c.date.trim().slice(0, 30) : '',
    url: typeof c.url === 'string' ? c.url.trim().slice(0, 250) : ''
  })) : [];

  // Languages validation
  const languages = Array.isArray(body.languages) ? body.languages.map((l: any) => ({
    id: typeof l.id === 'string' ? l.id : Math.random().toString(36).substring(2, 9),
    name: typeof l.name === 'string' ? l.name.trim().slice(0, 100) : '',
    proficiency: ['native', 'fluent', 'advanced', 'intermediate', 'basic'].includes(l.proficiency) ? l.proficiency : 'intermediate'
  })) : [];

  // Links validation
  const links = Array.isArray(body.links) ? body.links.map((lnk: any) => ({
    id: typeof lnk.id === 'string' ? lnk.id : Math.random().toString(36).substring(2, 9),
    platform: typeof lnk.platform === 'string' ? lnk.platform.trim().slice(0, 50) : '',
    url: typeof lnk.url === 'string' ? lnk.url.trim().slice(0, 250) : ''
  })) : [];

  const targetJobTitle = typeof body.targetJobTitle === 'string' ? body.targetJobTitle.trim().slice(0, 200) : '';
  const targetJobDescription = typeof body.targetJobDescription === 'string' ? body.targetJobDescription.trim().slice(0, 5000) : '';

  // Design Specification validation
  const rawSpec = body.designSpec || {};
  const designSpec: CVDesignSpecification = {
    primaryColor: typeof rawSpec.primaryColor === 'string' ? rawSpec.primaryColor.trim().slice(0, 20) : '#0284c7',
    headingColor: typeof rawSpec.headingColor === 'string' ? rawSpec.headingColor.trim().slice(0, 20) : '#0f172a',
    fontFamily: ['sans', 'serif', 'mono', 'inter', 'cormorant'].includes(rawSpec.fontFamily) ? rawSpec.fontFamily : 'sans',
    fontSize: ['sm', 'md', 'lg'].includes(rawSpec.fontSize) ? rawSpec.fontSize : 'md',
    spacing: ['compact', 'normal', 'spacious'].includes(rawSpec.spacing) ? rawSpec.spacing : 'normal',
    headerStyle: ['centered', 'left_aligned', 'split', 'banner'].includes(rawSpec.headerStyle) ? rawSpec.headerStyle : 'left_aligned',
    columns: ['single', 'two_column'].includes(rawSpec.columns) ? rawSpec.columns : 'single',
    sectionOrder: Array.isArray(rawSpec.sectionOrder) ? rawSpec.sectionOrder.map((s: any) => String(s)) : ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
    hiddenSections: Array.isArray(rawSpec.hiddenSections) ? rawSpec.hiddenSections.map((s: any) => String(s)) : [],
    photoSize: ['none', 'small', 'medium', 'large'].includes(rawSpec.photoSize) ? rawSpec.photoSize : 'none',
    contentDensity: ['compact', 'normal', 'spacious'].includes(rawSpec.contentDensity) ? rawSpec.contentDensity : 'normal',
    targetPageCount: typeof rawSpec.targetPageCount === 'number' ? Math.max(1, Math.min(3, rawSpec.targetPageCount)) : 1
  };

  return {
    valid: true,
    sanitized: {
      title,
      language,
      template,
      status,
      isPrimary,
      personalInfo,
      summary,
      experiences,
      education,
      skills,
      projects,
      certificates,
      languages,
      links,
      targetJobTitle,
      targetJobDescription,
      designSpec
    }
  };
}
