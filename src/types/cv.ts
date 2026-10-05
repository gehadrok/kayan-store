export type CVTemplateType =
  | 'professional_classic'
  | 'modern_professional'
  | 'executive'
  | 'tech'
  | 'minimal'
  | 'ats_friendly'
  | 'academic'
  | 'administrative'
  | 'creative'
  | 'modern_elegant'
  | 'two_column'
  | 'corporate_formal'
  | 'graduate_entry'
  | 'senior_experienced'
  | 'creative_roles';

export type CVStatus = 'draft' | 'published';

export interface CVDesignSpecification {
  primaryColor: string; // e.g. '#0284c7'
  headingColor: string; // e.g. '#0f172a'
  fontFamily: 'sans' | 'serif' | 'mono' | 'inter' | 'cormorant';
  fontSize: 'sm' | 'md' | 'lg';
  spacing: 'compact' | 'normal' | 'spacious';
  headerStyle: 'centered' | 'left_aligned' | 'split' | 'banner';
  columns: 'single' | 'two_column';
  sectionOrder: string[]; // e.g. ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages']
  hiddenSections: string[];
  photoSize: 'none' | 'small' | 'medium' | 'large';
  contentDensity: 'compact' | 'normal' | 'spacious';
  targetPageCount: number; // 1 or 2
}

export interface CVPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  photoUrl?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface CVExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements?: string[];
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  grade?: string;
}

export interface CVSkill {
  id: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

export interface CVProject {
  id: string;
  title: string;
  description: string;
  url?: string;
  technologies?: string[];
}

export interface CVCertificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface CVLanguage {
  id: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export interface CVLink {
  id: string;
  platform: string;
  url: string;
}

export interface UserCV {
  id: string;
  userId: string;
  title: string;
  language: 'ar' | 'en';
  template: CVTemplateType;
  status: CVStatus;
  isPrimary: boolean;
  personalInfo: CVPersonalInfo;
  summary?: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  projects: CVProject[];
  certificates: CVCertificate[];
  languages: CVLanguage[];
  links: CVLink[];
  atsScore?: number;
  targetJobTitle?: string;
  targetJobDescription?: string;
  designSpec?: CVDesignSpecification;
  createdAt: string;
  updatedAt: string;
}

export interface CVTemplateInfo {
  id: CVTemplateType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'formal' | 'modern' | 'creative' | 'technical' | 'executive' | 'ats';
  defaultDesignSpec: Partial<CVDesignSpecification>;
}

export const TEMPLATE_REGISTRY: CVTemplateInfo[] = [
  {
    id: 'professional_classic',
    nameAr: 'احترافي كلاسيكي',
    nameEn: 'Professional Classic',
    descriptionAr: 'تصميم رسمي متوازن يناسب مختلف الوظائف الإدارية والشركات.',
    descriptionEn: 'Balanced formal design suitable for corporate and administrative roles.',
    category: 'formal',
    defaultDesignSpec: {
      primaryColor: '#0f172a',
      headingColor: '#1e293b',
      fontFamily: 'serif',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'modern_professional',
    nameAr: 'احترافي حديث',
    nameEn: 'Modern Professional',
    descriptionAr: 'لمسة عصرية نظيفة مع خطوط بارزة وتنسيق احترافي.',
    descriptionEn: 'Clean contemporary touch with sharp typography and professional layout.',
    category: 'modern',
    defaultDesignSpec: {
      primaryColor: '#0284c7',
      headingColor: '#0f172a',
      fontFamily: 'inter',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'executive',
    nameAr: 'تنفيذي (Executive)',
    nameEn: 'Executive',
    descriptionAr: 'تصميم فخم مخصص للقادة، المديرين، وأصحاب الخبرات الطويلة.',
    descriptionEn: 'Luxurious layout tailored for leaders, directors, and senior executives.',
    category: 'executive',
    defaultDesignSpec: {
      primaryColor: '#1e40af',
      headingColor: '#111827',
      fontFamily: 'cormorant',
      columns: 'single',
      headerStyle: 'centered',
      spacing: 'spacious'
    }
  },
  {
    id: 'tech',
    nameAr: 'تقني (Tech)',
    nameEn: 'Tech',
    descriptionAr: 'مصمم خصيصاً لمهندسي البرمجيات والمبرمجين وخبراء تقنية المعلومات.',
    descriptionEn: 'Tailored for software engineers, developers, and IT professionals.',
    category: 'technical',
    defaultDesignSpec: {
      primaryColor: '#059669',
      headingColor: '#064e3b',
      fontFamily: 'mono',
      columns: 'two_column',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'minimal',
    nameAr: 'بسيط (Minimal)',
    nameEn: 'Minimal',
    descriptionAr: 'تركيز كامل على المحتوى مع مساحات بيضاء أنيقة وتصميم هادئ.',
    descriptionEn: 'Content-focused minimalist aesthetic with clean whitespace.',
    category: 'modern',
    defaultDesignSpec: {
      primaryColor: '#475569',
      headingColor: '#0f172a',
      fontFamily: 'sans',
      columns: 'single',
      headerStyle: 'centered',
      spacing: 'compact'
    }
  },
  {
    id: 'ats_friendly',
    nameAr: 'ATS Friendly',
    nameEn: 'ATS Friendly',
    descriptionAr: 'تصميم محسّن خصيصاً لتجاوز أنظمة الفرز الآلي للشركات بكفاءة.',
    descriptionEn: 'Optimized specifically to pass automated applicant tracking systems (ATS).',
    category: 'ats',
    defaultDesignSpec: {
      primaryColor: '#000000',
      headingColor: '#000000',
      fontFamily: 'sans',
      columns: 'single',
      headerStyle: 'left_aligned',
      fontSize: 'sm'
    }
  },
  {
    id: 'academic',
    nameAr: 'أكاديمي',
    nameEn: 'Academic',
    descriptionAr: 'مناسب للباحثين، الأكاديميين، المعلمين، وأصحاب الأوراق البحثية.',
    descriptionEn: 'Ideal for researchers, educators, scholars, and academic professionals.',
    category: 'formal',
    defaultDesignSpec: {
      primaryColor: '#7c2d12',
      headingColor: '#431407',
      fontFamily: 'serif',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'administrative',
    nameAr: 'إداري',
    nameEn: 'Administrative',
    descriptionAr: 'تنظيم دقيق للخبرات الإدارية والعمليات والمهام التنظيمية.',
    descriptionEn: 'Precise arrangement for administrative experience and operations.',
    category: 'formal',
    defaultDesignSpec: {
      primaryColor: '#1e293b',
      headingColor: '#0f172a',
      fontFamily: 'inter',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'creative',
    nameAr: 'إبداعي (Creative)',
    nameEn: 'Creative',
    descriptionAr: 'مظهر مميز يعكس الطابع الإبداعي والفني للمصممين والمبتكرين.',
    descriptionEn: 'Distinctive layout reflecting artistic and creative flair.',
    category: 'creative',
    defaultDesignSpec: {
      primaryColor: '#db2777',
      headingColor: '#831843',
      fontFamily: 'sans',
      columns: 'two_column',
      headerStyle: 'banner'
    }
  },
  {
    id: 'modern_elegant',
    nameAr: 'أنيق (Modern Elegant)',
    nameEn: 'Modern Elegant',
    descriptionAr: 'توازن ساحر بين الأناقة البصرية والوضوح المهني.',
    descriptionEn: 'Charming balance between visual elegance and professional clarity.',
    category: 'modern',
    defaultDesignSpec: {
      primaryColor: '#8b5cf6',
      headingColor: '#4c1d95',
      fontFamily: 'inter',
      columns: 'single',
      headerStyle: 'centered'
    }
  },
  {
    id: 'two_column',
    nameAr: 'عمودان (Two Column)',
    nameEn: 'Two Column',
    descriptionAr: 'تخطيط ثنائي الأعمدة لتوزيع المهارات والمعلومات الجانبية بكفاءة.',
    descriptionEn: 'Two-column structure for efficient sidebar and main content split.',
    category: 'modern',
    defaultDesignSpec: {
      primaryColor: '#2563eb',
      headingColor: '#1e3a8a',
      fontFamily: 'sans',
      columns: 'two_column',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'corporate_formal',
    nameAr: 'رسمي للشركات',
    nameEn: 'Corporate Formal',
    descriptionAr: 'هيكلة تقليدية رصينة تناسب المؤسسات الكبرى والبنوك.',
    descriptionEn: 'Stately traditional structure suited for large enterprises and banking.',
    category: 'formal',
    defaultDesignSpec: {
      primaryColor: '#111827',
      headingColor: '#000000',
      fontFamily: 'serif',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'graduate_entry',
    nameAr: 'الخريجين والشباب',
    nameEn: 'Graduate & Entry Level',
    descriptionAr: 'مصمم خصيصاً لإبراز المؤهلات الأكاديمية والمشاريع الأولى للخريجين.',
    descriptionEn: 'Designed to highlight academic credentials and early projects for graduates.',
    category: 'modern',
    defaultDesignSpec: {
      primaryColor: '#4f46e5',
      headingColor: '#312e81',
      fontFamily: 'inter',
      columns: 'single',
      headerStyle: 'left_aligned'
    }
  },
  {
    id: 'senior_experienced',
    nameAr: 'الخبرات الطويلة',
    nameEn: 'Senior Experienced',
    descriptionAr: 'مساحات واسعة لاستعراض السيرة المهنية الحافلة بالإنجازات.',
    descriptionEn: 'Spacious presentation for rich, milestone-filled careers.',
    category: 'executive',
    defaultDesignSpec: {
      primaryColor: '#0f172a',
      headingColor: '#000000',
      fontFamily: 'serif',
      columns: 'single',
      headerStyle: 'left_aligned',
      spacing: 'spacious'
    }
  },
  {
    id: 'creative_roles',
    nameAr: 'الوظائف الإبداعية',
    nameEn: 'Creative Roles',
    descriptionAr: 'تنسيق استثنائي للمصممين وكتاب المحتوى ومديري المشاريع الإبداعية.',
    descriptionEn: 'Exceptional styling for designers, copywriters, and creative directors.',
    category: 'creative',
    defaultDesignSpec: {
      primaryColor: '#f59e0b',
      headingColor: '#78350f',
      fontFamily: 'sans',
      columns: 'two_column',
      headerStyle: 'split'
    }
  }
];
