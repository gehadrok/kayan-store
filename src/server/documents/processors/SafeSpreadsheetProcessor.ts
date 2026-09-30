/**
 * Kayan | كيان — Safe Spreadsheet Processor Implementation
 *
 * Implements ISpreadsheetProcessor with pre-flight ZIP inspection,
 * compression-ratio defenses, XML injection mitigation, timeout protection,
 * memory bounds, and multi-sheet Arabic/English normalization using read-excel-file.
 */

import AdmZip from 'adm-zip';
import readXlsxFile from 'read-excel-file/node';
import type {
  ISpreadsheetProcessor,
  SpreadsheetSecurityOptions,
  SpreadsheetParseResult,
  SpreadsheetSheetMetadata
} from './ISpreadsheetProcessor.ts';

const DEFAULT_OPTIONS: Required<SpreadsheetSecurityOptions> = {
  maxFileSize: 25 * 1024 * 1024, // 25 MB
  maxUncompressedSize: 50 * 1024 * 1024, // 50 MB
  maxCompressionRatio: 50, // 50x
  maxSheets: 30,
  maxRowsPerSheet: 500,
  maxColumnsPerRow: 50,
  maxTotalCells: 50000,
  timeoutMs: 5000 // 5 seconds
};

export class SafeSpreadsheetProcessor implements ISpreadsheetProcessor {
  public readonly name = 'SafeSpreadsheetProcessor';
  public readonly version = '2.0.0';

  /**
   * Pre-flight binary and ZIP structure verification to defend against
   * ZIP bombs, directory traversal, macro injection, and XML entity attacks.
   */
  private preflightSecurityAudit(buffer: Buffer, opts: Required<SpreadsheetSecurityOptions>): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('FILE_PROCESSING_FAILED: Empty spreadsheet payload');
    }

    if (buffer.length > opts.maxFileSize) {
      throw new Error(`FILE_PROCESSING_FAILED: File size (${buffer.length} bytes) exceeds limit (${opts.maxFileSize} bytes)`);
    }

    // Verify standard PK ZIP signature (XLSX files are OpenXML ZIP packages)
    const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
    if (!isZip) {
      throw new Error('FILE_PROCESSING_FAILED: Invalid spreadsheet file signature (not a valid OpenXML package)');
    }

    // 1. Raw buffer path traversal scan (detects raw zip header path traversal before normalization)
    const rawBufferStr = buffer.toString('binary');
    if (rawBufferStr.includes('../') || rawBufferStr.includes('..\\')) {
      throw new Error('SECURITY_VIOLATION: Path traversal attempt detected in ZIP archive');
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new Error('FILE_PROCESSING_FAILED: Corrupted or malformed ZIP container');
    }

    const entries = zip.getEntries();
    if (!entries || entries.length === 0) {
      throw new Error('FILE_PROCESSING_FAILED: Empty OpenXML package');
    }

    let totalUncompressedSize = 0;
    let sheetXmlCount = 0;

    for (const entry of entries) {
      const entryName = entry.entryName;

      // Path traversal defense on entry name
      if (
        entryName.includes('..') ||
        entryName.startsWith('/') ||
        entryName.startsWith('\\') ||
        entryName.includes('\0') ||
        /^[a-zA-Z]:[\\/]/.test(entryName)
      ) {
        throw new Error(`SECURITY_VIOLATION: Path traversal attempt detected in entry: ${entryName}`);
      }

      // 2. Prohibit executable binaries and VBA macro code
      const lowerName = entryName.toLowerCase();
      if (
        lowerName.endsWith('vbaproject.bin') ||
        lowerName.endsWith('.exe') ||
        lowerName.endsWith('.dll') ||
        lowerName.endsWith('.bat') ||
        lowerName.endsWith('.cmd') ||
        lowerName.endsWith('.ps1') ||
        lowerName.endsWith('.sh')
      ) {
        throw new Error(`SECURITY_VIOLATION: Untrusted binary/macro content rejected: ${entryName}`);
      }

      // 3. Accumulate uncompressed size (header size check)
      const entrySize = entry.header ? entry.header.size : 0;
      totalUncompressedSize += entrySize;

      if (totalUncompressedSize > opts.maxUncompressedSize) {
        throw new Error(`SECURITY_VIOLATION: Uncompressed content (${totalUncompressedSize} bytes) exceeds safe limit (${opts.maxUncompressedSize} bytes) - ZIP bomb rejected`);
      }

      // 4. Count worksheet files
      if (entryName.startsWith('xl/worksheets/') && entryName.endsWith('.xml')) {
        sheetXmlCount++;
        if (sheetXmlCount > opts.maxSheets) {
          throw new Error(`SECURITY_VIOLATION: Worksheet count (${sheetXmlCount}) exceeds limit (${opts.maxSheets})`);
        }
      }

      // 5. Pre-flight XML entity expansion / SSRF scan on XML entries
      if (entryName.endsWith('.xml') && entrySize > 0 && entrySize < 2 * 1024 * 1024) {
        try {
          const content = entry.getData().toString('utf8');
          if (
            content.includes('<!ENTITY') ||
            content.includes('<!DOCTYPE') && content.includes('SYSTEM')
          ) {
            throw new Error(`SECURITY_VIOLATION: XML External Entity (XXE) / DTD injection attempt detected in ${entryName}`);
          }
        } catch (e: any) {
          if (e.message?.startsWith('SECURITY_VIOLATION:')) throw e;
        }
      }
    }

    // 6. Compression ratio defense
    const compressionRatio = totalUncompressedSize / Math.max(buffer.length, 1);
    if (compressionRatio > opts.maxCompressionRatio) {
      throw new Error(`SECURITY_VIOLATION: Abnormal compression ratio (${compressionRatio.toFixed(1)}x) exceeds threshold (${opts.maxCompressionRatio}x) - ZIP bomb rejected`);
    }
  }

  /**
   * Process and normalize the spreadsheet buffer into a secure structured representation.
   */
  public async process(
    buffer: Buffer,
    customOptions?: SpreadsheetSecurityOptions
  ): Promise<SpreadsheetParseResult> {
    const opts: Required<SpreadsheetSecurityOptions> = {
      ...DEFAULT_OPTIONS,
      ...customOptions
    };

    // 1. Run strict pre-flight security checks
    this.preflightSecurityAudit(buffer, opts);

    // 2. Parse workbook with timeout protection
    let rawSheets: Array<{ sheet: string; data: any[][] }> = [];
    try {
      const parsePromise = readXlsxFile(buffer);
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('TIMEOUT: Spreadsheet parsing took too long and was aborted for resource protection'));
        }, opts.timeoutMs);
        if (timer.unref) timer.unref();
      });

      rawSheets = await Promise.race([parsePromise, timeoutPromise]);
    } catch (err: any) {
      if (err.message && (err.message.startsWith('SECURITY_VIOLATION:') || err.message.startsWith('TIMEOUT:'))) {
        throw err;
      }
      throw new Error(`FILE_PROCESSING_FAILED: ${err.message || 'Unable to parse spreadsheet'}`);
    }

    if (!Array.isArray(rawSheets) || rawSheets.length === 0) {
      throw new Error('FILE_PROCESSING_FAILED: No worksheets found in spreadsheet');
    }

    const sheets: SpreadsheetSheetMetadata[] = [];
    let fullText = '';
    let totalCellsProcessed = 0;

    for (const rawSheet of rawSheets) {
      const sheetName = String(rawSheet.sheet || 'Sheet').trim();
      const rawData = Array.isArray(rawSheet.data) ? rawSheet.data : [];

      // Bound rows per sheet and total cell budget
      const boundedRows: any[][] = [];
      for (const row of rawData.slice(0, opts.maxRowsPerSheet)) {
        if (!Array.isArray(row)) continue;
        if (totalCellsProcessed >= opts.maxTotalCells) break;

        const boundedRow: any[] = [];
        for (const cell of row.slice(0, opts.maxColumnsPerRow)) {
          if (totalCellsProcessed >= opts.maxTotalCells) break;
          totalCellsProcessed++;

          if (cell instanceof Date) {
            boundedRow.push(cell.toISOString());
          } else if (typeof cell === 'string') {
            boundedRow.push(cell.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '').trim());
          } else if (typeof cell === 'number' || typeof cell === 'boolean') {
            boundedRow.push(cell);
          } else {
            boundedRow.push(cell ?? null);
          }
        }
        boundedRows.push(boundedRow);
      }

      const columnCount = boundedRows[0] && Array.isArray(boundedRows[0]) ? boundedRows[0].length : 0;

      sheets.push({
        sheetName,
        rowCount: rawData.length,
        columnCount,
        sampleRows: boundedRows.slice(0, 50)
      });

      fullText += `Sheet [${sheetName}] (showing up to ${opts.maxRowsPerSheet} rows):\n${JSON.stringify(boundedRows)}\n\n`;

      if (totalCellsProcessed >= opts.maxTotalCells) {
        break;
      }
    }

    return {
      text: fullText.trim(),
      sheets,
      totalSheets: sheets.length,
      totalCells: totalCellsProcessed
    };
  }
}

// Global default singleton instance
export const defaultSpreadsheetProcessor = new SafeSpreadsheetProcessor();
