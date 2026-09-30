import mammoth from 'mammoth';

export async function processDocx(buffer: Buffer): Promise<{ text: string }> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: (result.value || '').trim()
    };
  } catch (err: any) {
    throw new Error('FILE_PROCESSING_FAILED');
  }
}
