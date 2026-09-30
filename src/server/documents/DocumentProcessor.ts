import { NormalizedDocument } from './DocumentTypes.ts';
import { processPdf } from './processors/PdfProcessor.ts';
import { processDocx } from './processors/DocxProcessor.ts';
import { processSpreadsheet } from './processors/SpreadsheetProcessor.ts';
import { processCsv } from './processors/CsvProcessor.ts';
import { processImage } from './processors/ImageProcessor.ts';

export class DocumentProcessor {
  static async process(id: string, mimeType: string, extension: string, buffer: Buffer): Promise<NormalizedDocument> {
    const ext = (extension || '').toLowerCase().replace(/^\./, '');
    const mime = (mimeType || '').toLowerCase();

    // Check unsupported legacy .doc
    if (ext === 'doc' || mime === 'application/msword') {
      throw new Error('DOC_FORMAT_NOT_SUPPORTED');
    }

    if (ext === 'pdf' || mime === 'application/pdf') {
      const result = await processPdf(buffer);
      return {
        documentId: id,
        type: 'pdf',
        metadata: { pages: result.pages, hasText: result.text.length > 0 },
        pages: result.pages,
        text: result.text
      };
    }

    if (
      ext === 'docx' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await processDocx(buffer);
      return {
        documentId: id,
        type: 'docx',
        metadata: { hasText: result.text.length > 0 },
        text: result.text
      };
    }

    if (
      ext === 'xlsx' ||
      ext === 'xls' ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel'
    ) {
      const result = await processSpreadsheet(buffer);
      return {
        documentId: id,
        type: ext === 'xls' ? 'xls' : 'xlsx',
        metadata: { sheetCount: result.sheets.length },
        sheets: result.sheets,
        text: result.text
      };
    }

    if (ext === 'csv' || mime === 'text/csv' || mime === 'application/csv') {
      const result = await processCsv(buffer);
      return {
        documentId: id,
        type: 'csv',
        metadata: {},
        text: result.text
      };
    }

    if (
      ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ||
      mime.startsWith('image/')
    ) {
      const result = await processImage(buffer, mime);
      return {
        documentId: id,
        type: 'image',
        metadata: { isImage: true },
        text: result.text,
        base64Image: result.base64Data,
        mimeType: result.mimeType
      };
    }

    throw new Error('FILE_TYPE_NOT_SUPPORTED');
  }
}
