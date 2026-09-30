/**
 * Kayan | كيان — Spreadsheet Processor Architecture Boundary
 *
 * Defines the public contract for spreadsheet ingestion and normalization.
 * Guarantees that Kayan AI and document processing do not couple directly
 * to any underlying XLSX parsing library.
 */

export interface SpreadsheetSecurityOptions {
  /** Maximum allowable file buffer size in bytes (default: 25MB) */
  maxFileSize?: number;
  /** Maximum allowable uncompressed aggregate size in bytes (default: 50MB) */
  maxUncompressedSize?: number;
  /** Maximum allowable compression ratio before zip bomb alert (default: 50x) */
  maxCompressionRatio?: number;
  /** Maximum number of worksheets allowed per workbook (default: 30) */
  maxSheets?: number;
  /** Maximum rows extracted per worksheet for analysis (default: 500) */
  maxRowsPerSheet?: number;
  /** Maximum columns extracted per row (default: 50) */
  maxColumnsPerRow?: number;
  /** Maximum total cells processed across all worksheets (default: 50,000) */
  maxTotalCells?: number;
  /** Parsing timeout limit in milliseconds (default: 5,000ms) */
  timeoutMs?: number;
}

export interface SpreadsheetSheetMetadata {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  sampleRows: any[][];
}

export interface SpreadsheetParseResult {
  text: string;
  sheets: SpreadsheetSheetMetadata[];
  totalSheets?: number;
  totalCells?: number;
}

export interface ISpreadsheetProcessor {
  readonly name: string;
  readonly version: string;
  process(buffer: Buffer, options?: SpreadsheetSecurityOptions): Promise<SpreadsheetParseResult>;
}
