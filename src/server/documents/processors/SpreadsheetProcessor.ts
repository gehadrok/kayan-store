/**
 * Kayan | كيان — Spreadsheet Processor Boundary Facade
 *
 * Exposes the standard public API consumed by DocumentProcessor and AI routes,
 * delegating all execution to the hardened SafeSpreadsheetProcessor.
 */

import { defaultSpreadsheetProcessor, SafeSpreadsheetProcessor } from './SafeSpreadsheetProcessor.ts';
import type { ISpreadsheetProcessor, SpreadsheetParseResult } from './ISpreadsheetProcessor.ts';

export { defaultSpreadsheetProcessor, SafeSpreadsheetProcessor };
export type { ISpreadsheetProcessor, SpreadsheetParseResult };

/**
 * Normalized public processor contract for user-uploaded spreadsheets.
 * Preserves the exact signature consumed across DocumentProcessor and AI Gateway.
 */
export async function processSpreadsheet(buffer: Buffer): Promise<{ text: string; sheets: any[] }> {
  try {
    const result = await defaultSpreadsheetProcessor.process(buffer);
    return {
      text: result.text,
      sheets: result.sheets
    };
  } catch (err: any) {
    // Preserve standard Kayan error message contract
    throw new Error('FILE_PROCESSING_FAILED');
  }
}
