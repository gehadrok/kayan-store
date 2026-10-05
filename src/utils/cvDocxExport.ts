import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  ExternalHyperlink,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';
import { UserCV } from '../types/cv.ts';

export const exportCvToDocx = async (cv: UserCV) => {
  const isRtl = cv.language === 'ar';
  const t = (ar: string, en: string) => (isRtl ? ar : en);

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: cv.personalInfo.fullName,
          bold: true,
          size: 32,
          font: isRtl ? 'Arial' : 'Calibri',
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: cv.personalInfo.headline || cv.targetJobTitle || '',
          size: 24,
          color: '444444',
          font: isRtl ? 'Arial' : 'Calibri',
        }),
      ],
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${cv.personalInfo.email} | ${cv.personalInfo.phone} | ${cv.personalInfo.location}`,
          size: 20,
          font: isRtl ? 'Arial' : 'Calibri',
        }),
      ],
      spacing: { after: 400 },
    }),

    // Summary
    ...(cv.summary ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('النبذة المهنية', 'Professional Summary'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: cv.summary,
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      }),
    ] : []),

    // Experience
    ...(cv.experiences.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('الخبرات المهنية', 'Work Experience'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      ...cv.experiences.flatMap(exp => [
        new Paragraph({
          children: [
            new TextRun({ text: exp.position, bold: true, size: 22 }),
            new TextRun({ text: ` | ${exp.company}`, color: '666666', size: 22 }),
          ],
          spacing: { before: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.startDate} - ${exp.current ? t('الآن', 'Present') : exp.endDate}`, size: 18, italics: true }),
            new TextRun({ text: exp.location ? ` | ${exp.location}` : '', size: 18 }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: exp.description, size: 20 }),
          ],
          spacing: { after: 200 },
        }),
      ])
    ] : []),

    // Education
    ...(cv.education.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('التعليم', 'Education'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      ...cv.education.flatMap(edu => [
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22 }),
            new TextRun({ text: ` - ${edu.institution}`, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.endDate}${edu.location ? ` | ${edu.location}` : ''}`, size: 18, italics: true }),
          ],
          spacing: { after: 150 },
        }),
      ])
    ] : []),

    // Skills
    ...(cv.skills.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('المهارات', 'Skills'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: cv.skills.map(s => s.name).join(' • '),
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      }),
    ] : []),

    // Projects
    ...(cv.projects.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('المشاريع', 'Projects'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      ...cv.projects.flatMap(p => [
        new Paragraph({
          children: [
            new TextRun({ text: p.title, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: p.description, size: 20 }),
          ],
          spacing: { after: 150 },
        }),
      ])
    ] : []),

    // Certificates
    ...(cv.certificates.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('الشهادات', 'Certifications'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      ...cv.certificates.flatMap(c => [
        new Paragraph({
          children: [
            new TextRun({ text: c.name, bold: true, size: 22 }),
            new TextRun({ text: ` (${c.issuer})`, size: 20 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: c.date, size: 18, italics: true }),
          ],
          spacing: { after: 100 },
        }),
      ])
    ] : []),

    // Languages
    ...(cv.languages.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('اللغات', 'Languages'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
            font: 'Arial'
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: cv.languages.map(l => `${l.name} (${l.proficiency})`).join(' • '),
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      }),
    ] : []),

    // Links
    ...(cv.links.length > 0 ? [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: t('الروابط', 'Links'),
            bold: true,
            size: 24,
            underline: { type: BorderStyle.SINGLE },
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
      ...cv.links.map(l => (
        new Paragraph({
          children: [
            new TextRun({ text: `${l.platform}: `, bold: true, size: 20 }),
            new TextRun({ text: l.url, color: '0563C1', size: 20 }),
          ],
        })
      ))
    ] : []),
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fullName = cv.personalInfo.fullName || 'CV';
  const fileName = `${fullName.replace(/\s+/g, '_')}_Kayan_CV.docx`;
  saveAs(blob, fileName);
};
