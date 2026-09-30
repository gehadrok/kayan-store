# KAYAN STORE V2 — SYSTEM ARCHITECTURE DOCUMENTATION

## 1. Current Architecture
Kayan Store V2 is built as a full-stack digital store application running on React, TypeScript, Express, and Vite.
- **Frontend Layer**: React SPA with Vite, styled with Tailwind CSS, supporting dual Arabic/English RTL/LTR interfaces.
- **Backend API Layer**: Node.js Express server running on port 3000 handling authentication, catalog management, media uploads, file downloads, and admin controls.
- **Database Abstraction**: Dual-layer storage engine supporting PostgreSQL (via `pg.Pool` with parameterized queries and indexes) with a reliable local JSON database fallback (`kayan_data.json`).
- **File Storage**: Abstracted storage driver (`IArtifactStorage` & `IMediaStorage`) supporting Local Disk storage, GitHub Release Asset Storage (for official Kayan PDF APK releases), and S3 Object Storage fallback.
- **Applications & Products**: Native support for both Kayan PDF Android application release system (APKs, release notes, SHA-256 integrity) and general digital marketplace products (ebooks, software, templates, courses, audio, design assets, and digital files).

---

## 2. Target Architecture
The Target Architecture establishes a modular domain layout separating core marketplace entities from auxiliary services:

```
KAYAN STORE
├── Catalog          (Categories, Featured Items, Product Filters)
├── Products         (Multi-type Digital Assets, Metadata, Files, Media)
├── Applications     (Android Utilities, Release Tracking)
├── Releases         (APK Assets, Version Code, SHA-256 Checksums)
├── Media            (Product Covers, Screenshots, Gallery, Video Embeds)
├── Files            (Downloadable ZIPs, PDFs, Supplementary Docs)
├── Users            (End-User Profiles, Roles, Authentication)
├── Orders           (Checkout, Transactions, Purchase History)
├── Library          (User Purchases, Entitlements, License Keys)
├── Search           (Indexed Multi-field Search)
├── Storage          (Local, GitHub Release, S3 Object Storage)
├── Admin            (Audit Logs, Admin Auth, Product Management)
└── Kayan AI         (Server-Side AI Gateway & Generation Engine)
```

---

## 3. Domain Modules
- **Catalog & Products**: Manages multi-category digital goods (Ebook, Android App, Desktop Software, Template, Course, Audio, Design, Digital File).
- **Applications & Releases**: Dedicated module tracking Android application releases with release notes, minimum OS versions, and checksum verification.
- **Users, Orders & Library**: Domain boundary for customer accounts, purchases, order items, and entitlements (`User`, `Order`, `Entitlement`, `Review`, `Favorite`).
- **Kayan AI**: Autonomous server-side gateway handling text, image, video, code, and document analysis tasks (`AIProject`, `AIJob`, `AIAsset`, `AIUsage`).

---

## 4. Storage Architecture
Storage operations are handled via `IArtifactStorage` and `IMediaStorage` interfaces:
- **LocalDiskArtifactStorage**: Saves files to `uploads/apks`, `uploads/products`, and `uploads/media`.
- **GitHubReleaseArtifactStorage**: Interacts with GitHub REST API to upload release assets for versioned APKs and digital product files.
- **S3CompatibleArtifactStorage**: S3/R2/GCS compatible Object Storage driver for cloud deployment.
- **Storage Factory (`getArtifactStorage`)**: Dynamically resolves the active storage driver based on `process.env.STORAGE_DRIVER`.

---

## 5. AI Architecture (Kayan AI Foundation)
Kayan AI operates as a clean, decoupled server-side module located at `src/server/ai/`:
- `AIProvider.ts`: Interface defining `generateText`, `generateImage`, `generateVideo`, `generateCode`, `analyzeFile`, and `understandImage`.
- `GeminiProvider.ts`: Native `@google/genai` wrapper supporting `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-image`, and `veo-3.1-lite-generate-preview`.
- `AIGateway.ts`: Central gateway managing provider resolution and job execution. Returns explicit `"AI provider is not configured"` errors when API keys are absent (no fake or mock responses).
- `AIJobQueue.ts`: Tracks asynchronous job execution (`queued`, `processing`, `completed`, `failed`, `cancelled`).

---

## 6. Security Boundaries
- **Admin Security**: All administrative endpoints require `requireAdmin` middleware checking bearer tokens against active admin sessions.
- **Secrets Isolation**: `DATABASE_URL`, `GITHUB_TOKEN`, `GEMINI_API_KEY`, and `passwordHash` are strictly isolated on the server side and never exposed to the client bundle.
- **Filename Sanitization**: Uploaded files undergo strict filename sanitization and path traversal prevention (`path.basename`).
- **Video Embed Security**: Product video embeds allow YouTube and Vimeo URLs exclusively after URL validation.

---

## 7. Migration Strategy & Future Phases
- **Phase 0 (Current)**: Architecture foundation, expanded domain types, storage factory, and clean Kayan AI server module.
- **Phase 1 (Next)**: Customer account registration, checkout flow, and purchase library.
- **Phase 2 (Future)**: S3 Object Storage production integration and Kayan AI automated product draft generation.
