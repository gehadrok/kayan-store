import { UserCV } from '../types/cv.ts';

export const DEMO_CV_AR: UserCV = {
  id: 'demo-ar',
  userId: 'demo',
  title: 'سيرة ذاتية تجريبية',
  language: 'ar',
  template: 'professional_classic',
  status: 'published',
  isPrimary: true,
  personalInfo: {
    fullName: 'أحمد محمد العريقي',
    headline: 'مهندس برمجيات أول',
    email: 'ahmed.alareeqi@example.com',
    phone: '+967 700 000 000',
    location: 'صنعاء، اليمن',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
    website: 'https://alareeqi.dev',
    linkedin: 'https://linkedin.com/in/ahmed-alareeqi',
    github: 'https://github.com/ahmed-dev',
    portfolio: 'https://portfolio.alareeqi.dev'
  },
  summary: 'مهندس برمجيات شغوف لديه خبرة تزيد عن 5 سنوات في تطوير تطبيقات الويب والأنظمة المؤسسية المعقدة. خبير في تقنيات Full-Stack مع تركيز خاص على React و Node.js. ساهمت في بناء منصات رقمية تخدم آلاف المستخدمين، مع الالتزام بأفضل ممارسات البرمجية وجودة الكود.',
  experiences: [
    {
      id: 'exp1',
      company: 'شركة تقنية حديثة (Modern Tech)',
      position: 'مهندس برمجيات أول (Senior Software Engineer)',
      location: 'صنعاء، اليمن',
      startDate: '2022-01',
      endDate: '2026-05',
      current: true,
      description: '• قيادة فريق مكون من 5 مطورين لبناء منصة تجارة إلكترونية متطورة.\n• تحسين أداء التطبيق بنسبة 40% من خلال تحسين استعلامات قاعدة البيانات واستخدام التخزين المؤقت.\n• تطبيق معايير الأمان والحماية المتقدمة للبيانات.\n• تصميم وتنفيذ بنية الخدمات المصغرة (Microservices) لضمان قابلية التوسع.'
    },
    {
      id: 'exp2',
      company: 'شركة الحلول الرقمية (Digital Solutions)',
      position: 'مطور ويب (Web Developer)',
      location: 'صنعاء، اليمن',
      startDate: '2019-06',
      endDate: '2022-12',
      current: false,
      description: '• تطوير واجهات المستخدم باستخدام React و Tailwind CSS.\n• بناء لوحات تحكم إدارية مخصصة للعملاء.\n• التعاون مع فريق التصميم لتحويل ملفات Figma إلى أكواد برمجية دقيقة.\n• صيانة وتحديث المواقع القائمة وتحسين محركات البحث (SEO).'
    }
  ],
  education: [
    {
      id: 'edu1',
      institution: 'جامعة صنعاء',
      degree: 'بكالوريوس هندسة برمجيات',
      field: 'علوم الحاسوب وهندسة البرمجيات',
      location: 'صنعاء',
      startDate: '2015-09',
      endDate: '2019-07',
      grade: 'امتياز مع مرتبة الشرف'
    }
  ],
  skills: [
    { id: 's1', name: 'JavaScript / TypeScript', level: 'expert' },
    { id: 's2', name: 'React / Next.js', level: 'expert' },
    { id: 's3', name: 'Node.js / Express', level: 'advanced' },
    { id: 's4', name: 'PostgreSQL / MongoDB', level: 'advanced' },
    { id: 's5', name: 'Docker / Kubernetes', level: 'intermediate' },
    { id: 's6', name: 'Git / CI-CD', level: 'advanced' },
    { id: 's7', name: 'UI/UX Principles', level: 'intermediate' }
  ],
  projects: [
    {
      id: 'p1',
      title: 'نظام إدارة الموارد المؤسسية (ERP System)',
      description: 'نظام متكامل لإدارة المخازن، المبيعات، والموارد البشرية للشركات المتوسطة والصغيرة.',
      url: 'https://github.com/ahmed-dev/erp-system',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis']
    },
    {
      id: 'p2',
      title: 'منصة "كيان" للتجارة الإلكترونية',
      description: 'منصة متعددة البائعين تدعم الدفع الإلكتروني وتتبع الشحنات في الوقت الفعلي.',
      url: 'https://kayan-store.com',
      technologies: ['Next.js', 'Firebase', 'Stripe', 'Tailwind']
    }
  ],
  certificates: [
    {
      id: 'c1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2024'
    },
    {
      id: 'c2',
      name: 'Full-Stack Web Development Professional',
      issuer: 'Udacity / Meta',
      date: '2021'
    }
  ],
  languages: [
    { id: 'l1', name: 'العربية', proficiency: 'native' },
    { id: 'l2', name: 'الإنجليزية', proficiency: 'fluent' }
  ],
  links: [
    { id: 'lnk1', platform: 'LinkedIn', url: 'https://linkedin.com/in/ahmed-alareeqi' },
    { id: 'lnk2', platform: 'GitHub', url: 'https://github.com/ahmed-dev' },
    { id: 'lnk3', platform: 'Portfolio', url: 'https://alareeqi.dev' }
  ],
  designSpec: {
    primaryColor: '#0284c7',
    headingColor: '#0f172a',
    fontFamily: 'sans',
    fontSize: 'md',
    spacing: 'normal',
    headerStyle: 'left_aligned',
    columns: 'single',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
    hiddenSections: [],
    photoSize: 'medium',
    contentDensity: 'normal',
    targetPageCount: 1
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEMO_CV_EN: UserCV = {
  id: 'demo-en',
  userId: 'demo',
  title: 'Demo Resume',
  language: 'en',
  template: 'modern_professional',
  status: 'published',
  isPrimary: true,
  personalInfo: {
    fullName: 'Ahmed Mohammed Al-Areeqi',
    headline: 'Senior Software Engineer',
    email: 'ahmed.alareeqi@example.com',
    phone: '+967 700 000 000',
    location: 'Sana\'a, Yemen',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
    website: 'https://alareeqi.dev',
    linkedin: 'https://linkedin.com/in/ahmed-alareeqi',
    github: 'https://github.com/ahmed-dev',
    portfolio: 'https://portfolio.alareeqi.dev'
  },
  summary: 'Passionate Software Engineer with 5+ years of experience in building high-quality web applications and enterprise systems. Expert in modern Full-Stack technologies with a focus on React and Node.js. Committed to delivering clean, maintainable code and exceptional user experiences.',
  experiences: [
    {
      id: 'exp1',
      company: 'Modern Tech Co.',
      position: 'Senior Software Engineer',
      location: 'Sana\'a, Yemen',
      startDate: 'Jan 2022',
      endDate: 'May 2026',
      current: true,
      description: '• Led a team of 5 developers to build a scalable e-commerce platform.\n• Improved application performance by 40% through DB optimization and caching.\n• Implemented advanced security protocols for data protection.\n• Designed and architected Microservices for better scalability.'
    },
    {
      id: 'exp2',
      company: 'Digital Solutions',
      position: 'Web Developer',
      location: 'Sana\'a, Yemen',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      current: false,
      description: '• Developed user interfaces using React and Tailwind CSS.\n• Built custom administrative dashboards for diverse clients.\n• Collaborated with UX/UI designers to transform Figma designs into pixel-perfect code.\n• Maintained existing sites and improved SEO scores by 25%.'
    }
  ],
  education: [
    {
      id: 'edu1',
      institution: 'Sana\'a University',
      degree: 'Bachelor of Software Engineering',
      field: 'Computer Science',
      location: 'Sana\'a',
      startDate: 'Sep 2015',
      endDate: 'Jul 2019',
      grade: 'Excellent with Honors'
    }
  ],
  skills: [
    { id: 's1', name: 'JavaScript / TypeScript', level: 'expert' },
    { id: 's2', name: 'React / Next.js', level: 'expert' },
    { id: 's3', name: 'Node.js / Express', level: 'advanced' },
    { id: 's4', name: 'PostgreSQL / MongoDB', level: 'advanced' },
    { id: 's5', name: 'Docker / Kubernetes', level: 'intermediate' },
    { id: 's6', name: 'Git / CI-CD', level: 'advanced' }
  ],
  projects: [
    {
      id: 'p1',
      title: 'ERP Management System',
      description: 'A comprehensive system for inventory, sales, and HR management for SMEs.',
      url: 'https://github.com/ahmed-dev/erp-system',
      technologies: ['React', 'Node.js', 'PostgreSQL']
    },
    {
      id: 'p2',
      title: 'Kayan E-Commerce Platform',
      description: 'Multi-vendor marketplace supporting online payments and real-time tracking.',
      url: 'https://kayan-store.com',
      technologies: ['Next.js', 'Firebase', 'Stripe']
    }
  ],
  certificates: [
    {
      id: 'c1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2024'
    },
    {
      id: 'c2',
      name: 'Full-Stack Web Development',
      issuer: 'Udacity / Meta',
      date: '2021'
    }
  ],
  languages: [
    { id: 'l1', name: 'Arabic', proficiency: 'native' },
    { id: 'l2', name: 'English', proficiency: 'fluent' }
  ],
  links: [
    { id: 'lnk1', platform: 'LinkedIn', url: 'https://linkedin.com/in/ahmed-alareeqi' },
    { id: 'lnk2', platform: 'GitHub', url: 'https://github.com/ahmed-dev' }
  ],
  designSpec: {
    primaryColor: '#0284c7',
    headingColor: '#0f172a',
    fontFamily: 'sans',
    fontSize: 'md',
    spacing: 'normal',
    headerStyle: 'left_aligned',
    columns: 'single',
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'],
    hiddenSections: [],
    photoSize: 'medium',
    contentDensity: 'normal',
    targetPageCount: 1
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
