# KAYAN STORE V2 — PHASE 4: FILE INTELLIGENCE ENGINE

## 1. Architecture Overview

```
User (Authenticated)
      ↓
Kayan AI File Intelligence UI (/ai/documents, /ai/documents/:id)
      ↓
POST /api/ai/documents (Multipart / Validations)
      ↓
Artifact Storage (IArtifactStorage abstraction)
      ↓
Document Metadata (AIDocument in PostgreSQL / Local JSON)
      ↓
DocumentProcessor (Format extraction pipeline)
 ├── PdfProcessor (pdf-parse / PDFParse)
 ├── DocxProcessor (mammoth)
 ├── SpreadsheetProcessor (xlsx - cellFormula: false)
 ├── CsvProcessor (csv-parse/sync)
 └── ImageProcessor (base64 image payload)
      ↓
Normalized Document Content (Safe context / 12,000 char chunking)
      ↓
Prompt Injection Defense Layer (UNTRUSTED DATA separation)
      ↓
AIGateway (gemini-3.8-flash)
      ↓
AIJobQueue (queued → processing → completed/failed)
      ↓
AIUsage (Per-user, per-project token & cost metrics)
```

## 2. Supported Formats & Resource Limits

| Format | Extension | Max Size | Parsing Engine | Fallback / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | 50 MB | `pdf-parse` (PDFParse) | Password-protected throws `PDF_ENCRYPTED_OR_PROTECTED`. Scanned PDF returns `PDF_TEXT_NOT_EXTRACTABLE`. No fake OCR. |
| **Word** | `.docx` | 25 MB | `mammoth` | Extracts text, headings, tables. |
| **Legacy Word** | `.doc` | - | Rejected | Throws `DOC_FORMAT_NOT_SUPPORTED`. Legacy binary formats are rejected for safety. |
| **Excel** | `.xlsx`, `.xls` | 25 MB | `xlsx` | Multi-sheet parsing, formula execution disabled (`cellFormula: false`), max 500 rows/sheet. |
| **CSV** | `.csv` | 25 MB | `csv-parse/sync` | Streaming/sync parser, delimiter detection, max 1,000 records. |
| **Images** | `.jpg`, `.jpeg`, `.png`, `.webp` | 15 MB | ImageProcessor | Base64 encoded payload for Gemini vision models. |

## 3. Security Hardening & IDOR Protection

1. **Authentication & Ownership (IDOR):**
   - Every document has a mandatory `userId`.
   - Every endpoint (`/api/ai/documents/:id`, `/download`, `/analyze`, `/ask`, `/summarize`, `DELETE`) verifies `doc.userId === user.id`.
   - Unauthorized attempts by User B to access User A's documents return `403 DOCUMENT_UNAUTHORIZED` or `404 DOCUMENT_NOT_FOUND`.
2. **Path Traversal & Filename Sanitization:**
   - Detects and rejects filenames with `..`, `\0`, absolute paths, or Windows drive paths.
   - Sanitizes names using `path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_')`.
3. **Prompt Injection Defense:**
   - Document contents are explicitly enclosed in `[UNTRUSTED DOCUMENT CONTENT]` blocks.
   - System prompts instruct the model that document content is untrusted data and must never override system instructions.
4. **Context & Resource Protection:**
   - Document text is safely chunked / truncated to a maximum of 12,000 characters before sending to the model.
   - Spreadsheets are limited to 500 rows and 50 columns to prevent memory exhaustion.
   - CSVs are limited to 1,000 records.

## 4. API Endpoints

- `POST /api/ai/documents`: Secure multipart upload, validation, storage, and metadata creation.
- `GET /api/ai/documents`: List user documents with optional `projectId` filtering.
- `GET /api/ai/documents/:id`: Document details and extracted structure preview.
- `POST /api/ai/documents/:id/analyze`: Advanced document analysis (`summary`, `key_points`, `structured_data`, `financial_analysis`, `comparison`, `general`).
- `POST /api/ai/documents/:id/ask`: Interactive document Q&A.
- `POST /api/ai/documents/:id/summarize`: Executive summary and key points extraction.
- `GET /api/ai/documents/:id/download`: Secure authenticated download.
- `DELETE /api/ai/documents/:id`: Secure deletion of document metadata and physical files.

## 5. UI Routes

- `/ai/documents`: Document management list with upload zone and format badges.
- `/ai/documents/:id`: Complete document workspace with Overview, Analyze, Ask, and Summarize tabs.
- `/ai`: Studio overview updated with File Intelligence capability cards.
