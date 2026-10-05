# Kayan | كيان — Read-Only Code Audit: Environment Variables

**Audit Date:** September 30, 2026  
**Status:** COMPLETE (Read-Only)  
**Scope:** Full codebase search (`process.env`, `import.meta.env`, `dotenv`, AI, DB, Storage, Auth, Build)  

---

## 1. Environment Variable Audit Table

| VARIABLE | USED IN CODE | REQUIRED | PURPOSE | DEFAULT |
| :--- | :--- | :--- | :--- | :--- |
| **`DATABASE_URL`** | YES (`src/server/db.ts`) | **YES** (in Production) / **NO** (in Dev) | PostgreSQL database connection URI | None (Falls back to `data/store.json` in dev) |
| **`NODE_ENV`** | YES (`server.ts`, `src/server/db.ts`) | **YES** (for Production mode) | Identifies runtime mode (`production`) | Auto-detected (`production` if `dist/` exists, else `development`) |
| **`GEMINI_API_KEY`** | YES (`GeminiProvider.ts`, `AIModelRouter.ts`) | **CONDITIONAL** (External Prod) / **NO** (Boot) | Google Gemini API key for server AI | None (supports user BYOK / unconfigured boot) |
| **`AI_ENCRYPTION_MASTER_KEY`** | YES (`src/server/ai/utils/encryption.ts`) | **YES** (in Production) / **NO** (in Dev) | 32-byte hex key for AES-256-GCM BYOK encryption | Temporary in-memory key (regenerated on restart) |
| **`STORAGE_DRIVER`** | YES (`server.ts`, `src/server/db.ts`, `storage/`) | **NO** | Binary storage driver selection (`local`, `github`, `s3`) | `github` (if token set or in prod), otherwise `local` |
| **`GITHUB_TOKEN`** | YES (`src/server/db.ts`, `storage/`) | **CONDITIONAL** (YES if `STORAGE_DRIVER=github` in Prod) | GitHub PAT for storing release APKs on GitHub Releases | None |
| **`GITHUB_OWNER`** | YES (`src/server/storage/index.ts`) | **NO** | GitHub repository owner for release assets | `'gehadrok'` |
| **`GITHUB_REPOSITORY`** | YES (`storage/`, `GitHubActionsBuildProvider.ts`)| **NO** | GitHub repository name for release assets | `'kayan-store'` |
| **`PORT`** | YES (`server.ts`) | **NO** | Express HTTP listener port | `3000` |
| **`ADMIN_USERNAME`** | YES (`src/server/db.ts`) | **NO** | Default root administrator username seeded on first run | `'admin'` |
| **`ADMIN_INITIAL_PASSWORD`** | YES (`src/server/db.ts`) | **NO** | Default root administrator password seeded on first run | `'KayanAdmin#2026!'` |
| **`S3_BUCKET`** | YES (`src/server/storage/index.ts`) | **CONDITIONAL** (YES only if `STORAGE_DRIVER=s3`) | S3 bucket name | None |
| **`S3_ENDPOINT`** | YES (`src/server/storage/index.ts`) | **CONDITIONAL** (YES only if `STORAGE_DRIVER=s3`) | S3 endpoint URL (AWS, Cloudflare R2, MinIO) | None |
| **`S3_ACCESS_KEY_ID`** | YES (`src/server/storage/index.ts`) | **CONDITIONAL** (YES only if `STORAGE_DRIVER=s3`) | S3 Access Key ID | None |
| **`S3_SECRET_ACCESS_KEY`** | YES (`src/server/storage/index.ts`) | **CONDITIONAL** (YES only if `STORAGE_DRIVER=s3`) | S3 Secret Access Key | None |
| **`GITHUB_ACTIONS_TOKEN`** | YES (`GitHubActionsBuildProvider.ts`) | **NO** (Optional feature) | Token to dispatch remote GitHub Actions Android APK builds | Falls back to `GITHUB_TOKEN` |
| **`ANDROID_KEYSTORE`** | YES (`AndroidBuildProvider.ts`) | **NO** (Optional feature) | Path to `.keystore` / `.jks` file for local CLI APK signing | None |
| **`KEYSTORE_PASSWORD`** | YES (`AndroidBuildProvider.ts`) | **NO** (Optional feature) | Keystore password for local CLI APK signing | None |
| **`ENABLE_CONTAINER_SANDBOX`**| YES (`src/server/ai/previewRuntime.ts`) | **NO** (Optional feature) | Toggles Docker container sandbox runtime | `false` (safely defaults to isolated Static Preview) |
| **`FORCE_POSTGRES`** | YES (`src/server/db.ts`) | **NO** (Development-only) | Forces PostgreSQL mode outside production | `false` |
| **`STRICT_DB`** | YES (`src/server/db.ts`) | **NO** (Development-only) | Aborts boot on database error instead of falling back to JSON | `false` |
| **`OPENAI_API_KEY`** | YES (`OpenAIProvider.ts`, `AIModelRouter.ts`) | **NO** (Optional feature) | Secondary AI provider key (OpenAI) | None |
| **`ANTHROPIC_API_KEY`** | YES (`AnthropicProvider.ts`) | **NO** (Optional feature) | Secondary AI provider key (Anthropic) | None |
| **`OPENROUTER_API_KEY`** | YES (`OpenRouterProvider.ts`) | **NO** (Optional feature) | Secondary AI provider key (OpenRouter) | None |

---

## 2. Explicit Answers to Core Audit Questions

### 1. What exact variable does Gemini use?
- **`GEMINI_API_KEY`** (Referenced in `src/server/ai/providers/GeminiProvider.ts` line 206 and `src/server/ai/utils/AIModelRouter.ts` line 87). No aliases are used.

### 2. Is Gemini automatically supplied by AI Studio?
- **YES**. In the AI Studio runtime, `GEMINI_API_KEY` is automatically injected into `process.env` because `metadata.json` declares `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`. (In external standalone production, it must be supplied manually).

### 3. What exact variable is required for PostgreSQL?
- **`DATABASE_URL`** (Referenced in `src/server/db.ts` lines 40, 42, 467). Strictly enforced at boot when `NODE_ENV=production`.

### 4. What exact variable is required for AI encryption?
- **`AI_ENCRYPTION_MASTER_KEY`** (Referenced in `src/server/ai/utils/encryption.ts` lines 4–14). Must be a 32-byte hex string (64 characters) to encrypt user BYOK keys via AES-256-GCM.

### 5. Which variables can remain empty?
The following variables can safely remain empty during standard operation:
- `PORT` (defaults to `3000`)
- `STORAGE_DRIVER` (defaults based on environment)
- `ADMIN_USERNAME` (defaults to `'admin'`)
- `ADMIN_INITIAL_PASSWORD` (defaults to `'KayanAdmin#2026!'`)
- `GITHUB_OWNER` (defaults to `'gehadrok'`)
- `GITHUB_REPOSITORY` (defaults to `'kayan-store'`)
- `AI_ENCRYPTION_MASTER_KEY` (in dev: falls back to temporary in-memory key)
- `FORCE_POSTGRES` (defaults to `false`)
- `STRICT_DB` (defaults to `false`)
- In development (`NODE_ENV !== 'production'`), **all** variables can safely remain empty because the server cleanly falls back to local disk and JSON storage.

### 6. Which variables are required only for optional features?
- **S3 Storage Suite:** `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (required only if `STORAGE_DRIVER=s3`).
- **Remote Android CI/CD Builds:** `GITHUB_ACTIONS_TOKEN` (required only if dispatching remote GitHub Actions Android APK builds).
- **Local Android Keystore Signing:** `ANDROID_KEYSTORE`, `KEYSTORE_PASSWORD` (required only if building and signing APKs locally on the host machine).
- **Container Sandbox Runtime:** `ENABLE_CONTAINER_SANDBOX` (required only if spinning up Docker container sandboxes for live app execution; otherwise uses browser Static Preview).
- **Secondary AI Providers:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY` (required only if those specific third-party providers are used).
