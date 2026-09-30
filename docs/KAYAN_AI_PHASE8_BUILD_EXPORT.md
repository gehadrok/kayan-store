# KAYAN AI — PHASE 8: BUILD & EXPORT PIPELINE

## 1. Export Architecture
The Build & Export Pipeline transforms approved and validated Kayan AI App Builder projects into deterministic, versioned, checksum-verified project packages ready for external developer environments.
- **Pipeline Flow**: Approved Project → Architecture Gate → PIR Validation → Artifact Validation → Build Manifest → Package → Checksum Generation → Secure ZIP Export.

## 2. Build Manifest & Checksums
Every export generates a deterministic `MANIFEST.json` containing:
- Project ID, version, and generation timestamp.
- Target stack metadata (Frontend, Backend, Database).
- File paths, size in bytes, and cryptographic SHA-256 checksums per file.
- Aggregated file counts and total byte sizes.

## 3. Artifact Validation & Security
- **Path Sanitization**: Rejects path traversal (`..`), absolute paths, Windows drive letters, and null bytes (`EXPORT_ARTIFACT_INVALID`).
- **Secret Scanning**: Scans all artifact contents for sensitive credentials (`.env`, `GEMINI_API_KEY`, `DATABASE_URL`, private keys) and blocks export if detected (`EXPORT_SECRET_DETECTED`).
- **Forbidden Scripts**: Inspects package metadata for unsafe lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`) and flags warnings (`EXPORT_UNSAFE_SCRIPT`).

## 4. Export Limits & ZIP Safety
- **Size Limits**: Maximum 5,000 files, maximum 25 MB per individual file, maximum 250 MB total uncompressed package size (`EXPORT_SIZE_LIMIT`).
- **ZIP Protection**: Built using `adm-zip` with strict path normalization and ownership checks (IDOR protection yielding 403/404).

## 5. External Build Roadmap
Future external build services may connect to exports for automated containerized building, CI/CD verification, and APK/AAB generation in dedicated isolated cloud infrastructure.
