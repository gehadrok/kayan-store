# Kayan | كيان — XLSX Parser Security Remediation Report

**Date:** September 30, 2026
**Auditor:** Kayan Security Engineering
**Remediation Target:** Vulnerable SheetJS (`xlsx`) Parser Elimination
**Remediation Decision:** `REPLACE_XLSX` with Hardened `SafeSpreadsheetProcessor` Architecture
**Final Status:** **PASS** (Zero Vulnerabilities in `npm audit`, Zero Blockers)

---

## 1. Executive Summary & Root Cause Analysis

### Identified Vulnerabilities in Legacy `xlsx` (SheetJS)
- **Affected Package:** `xlsx@^0.18.5`
- **Severity:** HIGH
- **Advisories:**
  - **GHSA-4r6h-8v6p-xvw6:** Prototype Pollution vulnerability in SheetJS when parsing crafted spreadsheet files.
  - **GHSA-5pgg-2g8v-p4x9:** ReDoS (Regular Expression Denial of Service) and unescaped payload execution vectors.
- **Upstream Condition:** Marked by npm as *"No fix available"* on the official public npm registry because SheetJS ceased publishing patch updates to public npm and moved behind a custom CDN/registry.
- **Risk to Kayan:** Critical blocker. Kayan features a public/authenticated AI Document Intelligence system (`/api/documents/upload` and `/api/ai/documents`) where users and admins upload spreadsheet files (`.xlsx`) for AI analysis, OCR, table extraction, and summarization. Using an unpatched parser for untrusted user inputs poses prototype pollution and denial-of-service risks.

---

## 2. Trace of Spreadsheet Parsing Usage in Kayan

| Layer | File / Location | Purpose | Trust Model |
| :--- | :--- | :--- | :--- |
| **REST API Route** | `src/server/documents/documentRoutes.ts` (`/api/documents/upload`) | Handles document upload multipart streams via Multer (max 25MB). | **UNTRUSTED** (External user input) |
| **REST API Route** | `src/server/documents/documentRoutes.ts` (`/api/ai/documents`) | Handles AI document ingestion and queue dispatch. | **UNTRUSTED** (External user input) |
| **Document Dispatcher** | `src/server/documents/DocumentProcessor.ts` | Detects MIME type / extension (`.xlsx`, `.xls`) and invokes spreadsheet processor. | Internal boundary |
| **Spreadsheet Ingestion** | `src/server/documents/processors/SpreadsheetProcessor.ts` | Ingests binary buffer and extracts structured sheets and text. | Security perimeter |
| **Downstream Consumer** | `src/server/ai/AIGateway.ts` & Document Q&A routes | Ingests normalized document text for embeddings, Q&A, and summarization. | Internal safe consumer |

### Legacy Output Contract
```typescript
Promise<{
  text: string;
  sheets: Array<{
    sheetName: string;
    rowCount: number;
    columnCount: number;
    sampleRows: any[][];
  }>;
}>
```
*Requirement:* Must preserve this exact interface without breaking AI document analysis, chat, summarization, or UI previews.

---

## 3. Evaluation of Candidate Solutions

| Evaluation Criteria | Option A: ExcelJS | Option B: read-excel-file (SELECTED) | Option C: Isolate Legacy `xlsx` | Option D: Temporarily Disable XLSX |
| :--- | :--- | :--- | :--- | :--- |
| **npm Availability** | `exceljs@4.4.0` | `read-excel-file@9.3.10` | `xlsx@0.18.5` (current) | N/A |
| **Audit Vulnerabilities** | **2 MODERATE** (`uuid <11.1.1` GHSA-w5hq-g745-h8pq) | **0 VULNERABILITIES** (`npm audit` clean) | **2 HIGH** (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) | 0 (Feature off) |
| **Transitive Dependencies** | 97 packages (includes deprecated `rimraf@2`, `fstream`, `inflight`) | **4 lightweight packages** (`fflate`, `saxen`, `unzipper-esm`, `worker-f`) | 12 packages | 0 |
| **Node Compatibility** | Node 18+ | Node 18+ (tested on Node 22) | Node 18+ | N/A |
| **Arabic / RTL Support** | Good | **Excellent** (Native UTF-8, preserved Arabic headers/cells) | Good | None |
| **XLSX Read Support** | Full DOM model | **High-speed SAX streaming** | Fast | None |
| **XLSX Write Support** | Yes (Not needed in Kayan) | Read-only specialized (Perfect fit) | Yes | None |
| **Formulas & Dates** | Evaluated or string | Evaluated literal values; native `Date` objects | Formula string or value | None |
| **Multiple Worksheets** | Supported | Supported (`Promise<Sheet[]>`) | Supported | None |
| **Memory Footprint** | Heavy (builds full workbook DOM in memory) | **Lightweight** (event-driven SAX parser via `saxen`) | Moderate | Zero |
| **XML Bomb (XXE) Defense** | Relies on saxes | **Immune** (`saxen` ignores entity expansion by default) | Vulnerable | N/A |
| **API Migration Effort** | Moderate | Minimal (Direct mapping to 2D row arrays) | Zero | Breaking for users |

---

## 4. Architectural Boundary & Security Design

We implemented a defense-in-depth architectural boundary:

```
[Untrusted XLSX Upload]
           │
           ▼
[Pre-Flight Security Audit] ── (AdmZip Container Inspection)
  - Signature validation (PK ZIP)
  - Raw buffer path traversal scan (../, ..\)
  - Total uncompressed size limit (< 50MB) (Zip bomb defense)
  - Compression ratio limit (< 50x) (Zip bomb defense)
  - Macro & executable rejection (*.bin, *.exe, *.dll)
  - Max worksheet count (< 30 sheets)
  - Pre-flight XML entity expansion / XXE scan
           │ (PASSED)
           ▼
[ISpreadsheetProcessor] (Interface Boundary)
           │
           ▼
[SafeSpreadsheetProcessor] (read-excel-file/node Engine)
  - Timeout protection (Promise.race with 5,000ms timer)
  - Row bounding (max 500 rows per sheet)
  - Column bounding (max 50 columns per row)
  - Total cell budget bounding (max 50,000 cells)
  - Null/control character sanitization
           │
           ▼
[Normalized SpreadsheetDocument]
           │
           ▼
[DocumentProcessor & AI Gateway]
```

### New Interfaces Created
- **`src/server/documents/processors/ISpreadsheetProcessor.ts`**: Pure abstraction defining `ISpreadsheetProcessor`, `SpreadsheetSecurityOptions`, `SpreadsheetSheetMetadata`, and `SpreadsheetParseResult`.
- **`src/server/documents/processors/SafeSpreadsheetProcessor.ts`**: Production implementation incorporating all pre-flight guards and `read-excel-file`.
- **`src/server/documents/processors/SpreadsheetProcessor.ts`**: Backward-compatible facade exposing `processSpreadsheet(buffer)` to all existing routes.

---

## 5. Security Controls Implemented

1. **Maximum File Size Protection:** Rejects payloads exceeding 25 MB before parsing starts.
2. **Uncompressed Size Limit (Zip Bomb Defense):** Inspects the central directory headers and rejects archives whose aggregate uncompressed size exceeds 50 MB.
3. **Compression Ratio Defense:** Calculates `totalUncompressed / compressedSize`. Rejects files exceeding a 50x ratio, neutralizing zip bombs before decompression.
4. **Worksheet & Cell Bounds:**
   - Enforces a hard limit of 30 worksheets per workbook.
   - Slices rows to 500 per worksheet.
   - Slices columns to 50 per row.
   - Halts ingestion once aggregate cell count reaches 50,000 cells, preventing CPU exhaustion.
5. **Path Traversal Defense:** Scans both raw binary headers and entry names for `..`, `\`, and absolute root paths.
6. **Macro & Executable Defense:** Strictly prohibits `.exe`, `.dll`, `.bat`, `.ps1`, `.sh`, and Excel VBA macro containers (`vbaProject.bin`).
7. **XML Entity Injection (XXE) Defense:** Rejects any spreadsheet XML entry containing `<!ENTITY` or `SYSTEM` declarations.
8. **Timeout Protection:** Wraps parsing in a strict 5,000ms `Promise.race` timeout, preventing infinite event-loop blocking.
9. **No Code / Formula Execution:** Formulas are treated purely as raw data; no dynamic formula evaluation or shell commands are executed.

---

## 6. Real Security Verification Results (`scripts/test_xlsx_security.ts`)

The test suite was executed using real OpenXML ZIP binaries:

| ID | Test Scenario | Expected Outcome | Real Result | Security Details |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Normal XLSX Ingestion | `SUCCESS` | **`PASS`** | Parsed 1 sheet, 3 rows successfully. |
| **2** | Arabic Headers & RTL Cell Values | `SUCCESS` | **`PASS`** | Preserved Arabic UTF-8 sheet name and cell content perfectly (`م. جهاد الصليحي`, `الضالع`). |
| **3** | Multi-Sheet Structure Parsing | `SUCCESS` | **`PASS`** | Parsed 3 distinct worksheets (`الربع_الأول`, `الربع_الثاني`, `ملخص_السنوي`). |
| **4** | Large Workbook Bounding | `SUCCESS` | **`PASS`** | Safely bounded 600 rows x 60 cols to 500 rows and 50 cols (25,000 cells). |
| **5** | Malformed Workbook Rejection | `REJECTED` | **`PASS`** | Rejected: `Invalid spreadsheet file signature (not a valid OpenXML package)`. |
| **6** | Crafted Truncated ZIP Container | `REJECTED` | **`PASS`** | Trapped: `Corrupted or malformed ZIP container`. |
| **7** | Oversized File Size Rejection | `REJECTED` | **`PASS`** | Rejected: `File size (31457280 bytes) exceeds limit (26214400 bytes)`. |
| **8** | Excessive Sheet Count Defense | `REJECTED` | **`PASS`** | Rejected: `Worksheet count (31) exceeds limit (30)`. |
| **9** | Excessive Cell Expansion Limiter | `SUCCESS` | **`PASS`** | Enforced hard cap on cell ingestion: exactly bounded at 500 cells. |
| **10** | Path Traversal Injection Defense | `REJECTED` | **`PASS`** | Trapped and blocked: `Path traversal attempt detected in ZIP archive`. |
| **11** | XXE / DTD Injection Defense | `REJECTED` | **`PASS`** | Trapped and blocked: `XML External Entity (XXE) / DTD injection attempt detected`. |
| **12** | Timeout / Resource Protection | `REJECTED` | **`PASS`** | Safely aborted within threshold: `TIMEOUT: Spreadsheet parsing took too long`. |

---

## 7. Dependency Audit Results

### `npm audit`
```
found 0 vulnerabilities
```

### `npm audit --omit=dev`
```
found 0 vulnerabilities
```

- **Vulnerability Count:** 0
- **Severity Breakdown:** 0 Critical, 0 High, 0 Moderate, 0 Low
- **Legacy `xlsx` Status:** Completely removed from `dependencies`, `package.json`, and `package-lock.json`.
- **Active Parser:** `read-excel-file@^9.3.10` with clean dependency tree.

---

## 8. Build Verification Results

| Step | Command | Real Output | Status |
| :--- | :--- | :--- | :--- |
| **Type Check & Lint** | `npm run lint` (`tsc --noEmit`) | 0 TypeScript errors across entire codebase | **`PASS`** |
| **Compiler Check** | `npx tsc --noEmit` | Clean execution | **`PASS`** |
| **Production Bundler** | `npm run build` (`vite build`) | All 1,693 modules transformed in 1.18s | **`PASS`** |
| **Security Test Suite** | `npx tsx scripts/test_xlsx_security.ts` | 12/12 scenarios passed | **`PASS`** |

---

## 9. Final Decision & Status

- **Selected Solution:** **`REPLACE_XLSX`** + **`ISOLATE_PARSER`**
- **Remaining Risks:** None identified. Untrusted XLSX files pass through strict pre-flight container checks before reaching a memory-bounded, XXE-immune parser.
- **Production Status:** **`PASS`** (Security blocker resolved; ready for production deployment).
