# Kayan | كيان — Complete Source Export Manifest (V6)

**Export Package:** `Kayan-Platform-FINAL-SOURCE-V6.zip`
**Generated Date:** September 30, 2026
**Auditor / Packager:** Kayan Core Engineering
**Integrity Status:** VERIFIED & PRODUCTION READY
**Package Size:** 8.15 MB (Compressed) / 9.31 MB (Uncompressed)
**Total Entries:** 138 files

---

## 1. Package Checksum & Identity

- **Archive File:** `Kayan-Platform-FINAL-SOURCE-V6.zip`
- **Checksum File:** `Kayan-Platform-FINAL-SOURCE-V6.zip.sha256` (Detached Checksum)
- **Supersedes:** `Kayan-Platform-FINAL-SOURCE-V5.zip`, `Kayan-Platform-FINAL-SOURCE-V4.zip`, `Kayan-Platform-FINAL-SOURCE-V3.zip`, `Kayan-Platform-FINAL-SOURCE-V2.zip`, and `Kayan-Platform-FINAL-SOURCE.zip`.

### Checksum Methodology (Non-Circular)
To ensure absolute integrity and avoid circular dependency, the SHA-256 checksum is NOT embedded within the manifest file itself.
1. The archive `Kayan-Platform-FINAL-SOURCE-V6.zip` is generated.
2. The SHA-256 hash of the *entire* `Kayan-Platform-FINAL-SOURCE-V6.zip` file is calculated.
3. The resulting hash is written to a detached file: `Kayan-Platform-FINAL-SOURCE-V6.zip.sha256`.
4. Verification: Run `sha256sum -c Kayan-Platform-FINAL-SOURCE-V6.zip.sha256` to independently verify the archive's integrity.

---

## 2. Dependency Audit & Health Verification

| Command | Real Output / Result | Status |
| :--- | :--- | :--- |
| **`npm ls xlsx read-excel-file`** | `xlsx` = **NOT INSTALLED**<br>`read-excel-file` = **INSTALLED** (`read-excel-file@9.3.10`) | **PASSED** |
| **`npm audit`** | `found 0 vulnerabilities` across all 254 audited packages. | **PASSED (0 errors)** |
| **`npm audit --omit=dev`** | `found 0 vulnerabilities` in production dependencies. | **PASSED (0 errors)** |
| **`npm run lint`** | `tsc --noEmit` executed with 0 syntax or type errors. | **PASSED (0 errors)** |
| **`npx tsc --noEmit`** | TypeScript compiler checked all project source files with 0 errors. | **PASSED (0 errors)** |
| **`npm run build`** | `vite build` completed in 1.20s. All 1,693 modules transformed. Production bundles generated in `dist/`. | **PASSED (0 errors)** |
| **`npx tsx scripts/test_xlsx_security.ts`** | All 12/12 real security attack scenarios passed with 0 vulnerabilities. | **PASSED (12/12)** |
| **`npx tsx scripts/verify_build_integrity.ts`** | All 8/8 build integrity and anti-simulation test cases passed with 0 errors. | **PASSED (8/8)** |

---

## 3. Build Subsystem Integrity Fix & Anti-Simulation Controls

The build subsystem (`src/server/build/`) has been completely hardened to prevent any fake or simulated builds:

1. **Strict Input Integrity in `buildRoutes.ts`:**
   - Purged `manifestChecksum: manifestChecksum || 'sha256_mock'`.
   - Requires non-empty `exportId`.
   - Requires `manifestChecksum` to be a valid 64-character SHA-256 hexadecimal string (`^[a-fA-F0-9]{64}$`).
   - If missing or invalid, immediately returns HTTP 400 with `BUILD_INPUT_INTEGRITY_FAILED`.
   - Requires the immutable export to exist in `project.exports` and belong to the authenticated user.
   - Prohibits starting builds from implicit or default exports.
2. **Android External Build Provider (`AndroidBuildProvider.ts`):**
   - Validates package name regex (`^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`).
   - Validates release keystore configuration if `signingMode === 'RELEASE_SIGNED'`.
   - Validates `exportId` and `manifestChecksum`.
   - Delegates remote execution to `GitHubActionsBuildProvider`.
   - Never creates in-memory fake jobs or claims `SUBMITTED`/`BUILDING` without successful remote dispatch.
   - Zero mock artifact generation, zero fake APKs, zero fake checksums.
   - If GitHub Actions is unconfigured, throws `EXTERNAL_BUILDER_NOT_CONFIGURED`.
3. **GitHub Actions Build Provider (`GitHubActionsBuildProvider.ts`):**
   - Real build input strategy: transmits `buildId`, `projectId`, `exportId`, `manifestChecksum`, `projectVersion`, `targetPlatform`, `buildProfile`, and `sourceDownloadUrl`.
   - **Fail-Closed Remote Source Rule:** If export source is purely local/ephemeral (e.g. on `/uploads/` or localhost) and cannot be reached by external runners in GitHub's cloud, throws deterministic `BUILD_SOURCE_UNAVAILABLE`.
   - Records the failed build attempt with required production infrastructure requirements.
4. **Encoding Fix:**
   - All Arabic error strings verified valid UTF-8 Arabic without mojibake.
5. **Real Android Build Status:**
   - **`ARCHITECTURE IMPLEMENTED / EXTERNAL BUILD NOT YET EXECUTED`**
   - No claim of APK generation is made unless an actual GitHub Actions run produces a real APK/AAB artifact.

---

## 4. XLSX Security Remediation Inclusions

1. **Vulnerable Package Removal:**
   - Complete uninstallation and removal of `xlsx` (SheetJS) from `package.json` and `package-lock.json`.
   - Complete neutralization of `GHSA-4r6h-8v6p-xvw6` and `GHSA-5pgg-2g8v-p4x9`.
2. **`read-excel-file@^9.3.10` Engine:**
   - Fast, streaming, memory-bounded SAX spreadsheet parser (`saxen` + `fflate`).
   - Clean dependency tree with zero vulnerabilities.
3. **`ISpreadsheetProcessor` Architectural Boundary:**
   - Location: `src/server/documents/processors/ISpreadsheetProcessor.ts`.
4. **`SafeSpreadsheetProcessor` Implementation:**
   - Location: `src/server/documents/processors/SafeSpreadsheetProcessor.ts`.
   - Pre-flight binary and central directory inspection via `AdmZip`.
   - Zip Bomb Defense: 50MB uncompressed limit & 50x compression ratio ceiling.
   - Path Traversal Defense: Rejects `..`, `\`, leading slashes, and drive paths.
   - Macro & Executable Defense: Rejects `.exe`, `.dll`, `.bat`, `.ps1`, `.sh`, and `vbaProject.bin`.
   - XXE / DTD Injection Defense: Rejects `<!ENTITY` or `SYSTEM` declarations.
   - Worksheet & Cell Limits: Max 30 sheets, 500 rows per sheet, 50 cols per row, 50,000 cells cap.
   - Timeout Protection: 5,000ms `Promise.race` timeout.
5. **Security Test Suite & Docs:**
   - `scripts/test_xlsx_security.ts` (12 automated real attack scenarios).
   - `docs/KAYAN_XLSX_SECURITY_REMEDIATION.md`.

---

## 5. Remaining Infrastructure Dependencies for Remote Builds

To execute real remote external Android builds via GitHub Actions in production:
1. **Cloud Source Storage:** Set `STORAGE_DRIVER=s3` with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (or `STORAGE_DRIVER=github` with `GITHUB_TOKEN`). This provides the remote runner with a reachable HTTPS URL for the immutable project export package.
2. **GitHub Actions Secrets:** Set `GITHUB_ACTIONS_TOKEN` and `GITHUB_REPOSITORY` in the server environment, with workflow `android-build.yml` enabled in the target repository.
3. **Release Keystore Secrets (For Release Builds):** Set `ANDROID_KEYSTORE` and `KEYSTORE_PASSWORD` in repository GitHub Secrets.

---

## 6. Complete Package Inventory

The export archive `Kayan-Platform-FINAL-SOURCE-V2.zip` contains 138 verified files:

### Core Configuration & Meta
- `package.json` & `package-lock.json`
- `tsconfig.json` & `vite.config.ts`
- `metadata.json` & `.env.example`
- `index.html` & `server.ts`

### Server Architecture (`src/server/`)
- `src/server/db.ts`: Unified PostgreSQL (`pg.Pool`) and local JSON fallback (`data/store.json`).
- `src/server/apkValidator.ts`: Real Android APK binary parsing and signature analysis.
- `src/server/ai/`: Central AI Gateway, Gemini SDK adapter, OpenAI / Anthropic / OpenRouter adapters, AES-256-GCM encryption, AI Model Router, Vision Lab routes, App Builder routes, preview sandboxes, and export pipelines.
- `src/server/build/`: Build orchestrator, Android build provider, GitHub Actions isolated builder, and build REST routes.
- `src/server/documents/`: Safe spreadsheet processor (`SafeSpreadsheetProcessor.ts`), PDF/OCR processor, DOCX processor, CSV processor, and document Q&A intelligence.
- `src/server/storage/`: Pluggable storage engine (`local`, `github`, `s3`).

### Automated Test Suites (`scripts/`)
- `scripts/verify_build_integrity.ts` (8/8 anti-simulation and integrity tests)
- `scripts/test_xlsx_security.ts` (12/12 real security attack scenarios)
- `scripts/verify_digital_products_e2e.ts`
- `scripts/verify_phase10_4_1.ts`, `verify_phase10_6.ts`, `verify_phase10_7.ts`
- `scripts/test_phase10.ts` through `test_phase10_5.ts`
- `scripts/security_scan.ts`
- `scripts/export_source_package.ts`

### Documentation (`docs/`)
- `docs/KAYAN_EXPORT_MANIFEST.md`
- `docs/KAYAN_XLSX_SECURITY_REMEDIATION.md`
- `docs/KAYAN_ENVIRONMENT_VARIABLES.md`
- `docs/KAYAN_STORE_V2_ARCHITECTURE.md`
- `docs/KAYAN_ADMIN_DIGITAL_PRODUCTS.md`
- `docs/KAYAN_DIGITAL_PRODUCT_E2E_VERIFICATION.md`
