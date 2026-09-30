import { parse } from 'csv-parse/sync';

export async function processCsv(buffer: Buffer): Promise<{ text: string }> {
  try {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      to: 1000
    });
    return {
      text: JSON.stringify(records)
    };
  } catch (err: any) {
    throw new Error('FILE_PROCESSING_FAILED');
  }
}
