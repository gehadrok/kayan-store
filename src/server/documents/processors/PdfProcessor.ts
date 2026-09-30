import { PDFParse } from 'pdf-parse';

export async function processPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const rawText = (textResult.text || '').trim();
    const totalPages = textResult.total || (textResult.pages ? textResult.pages.length : 1);

    // Filter out pagination markers like '-- 1 of 1 --'
    const cleanedText = rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();

    return {
      text: cleanedText,
      pages: totalPages
    };
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('password') || msg.includes('encrypted') || msg.includes('decrypt')) {
      throw new Error('PDF_ENCRYPTED_OR_PROTECTED');
    }
    throw new Error('FILE_PROCESSING_FAILED');
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {}
    }
  }
}
