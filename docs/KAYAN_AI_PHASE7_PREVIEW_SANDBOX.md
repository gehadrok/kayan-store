# KAYAN AI — PHASE 7: SAFE APP PREVIEW SANDBOX

## 1. Architecture & Core Security Principle
The Kayan Store application server and the generated application runtime remain strictly isolated. Generated code is never executed inside the main Kayan Store Node.js process.
- **Control Plane**: Kayan Store backend handles specifications, architecture plans, PIR validation, and artifact generation.
- **Preview Runtime**: Isolated through the `PreviewManager` / `PreviewArtifact` abstraction layer.

## 2. Preview Lifecycle
Projects progress through explicit preview lifecycle states:
- `NOT_READY`: Specification or PIR not generated/approved.
- `READY`: Artifacts validated and ready for static inspection or container execution.
- `BUILDING`: Preparing build manifest and validating dependencies.
- `RUNNING`: Active preview runtime session.
- `FAILED`: Security violation or build error encountered.
- `STOPPED`: Explicitly terminated by user.
- `EXPIRED`: Automatically expired after lifetime threshold.

## 3. Runtime Availability & Static Fallback
Because arbitrary container creation or privileged execution is restricted in the server host environment:
- **`PREVIEW_RUNTIME_NOT_AVAILABLE`** is reported.
- A secure **Static Preview / Source Inspection** fallback is provided, allowing file tree inspection, artifact verification, and dependency analysis without executing arbitrary code.

## 4. Security Boundaries & Restrictions
- **Filesystem Isolation**: Generated applications can only access their isolated workspace. Path traversal (`..`, absolute paths, null bytes, `.env`, `/server`) is blocked.
- **Network Restrictions**: Unrestricted outbound internet access is denied by default; SSRF and private network scanning are prevented.
- **Secret Isolation**: Host secrets (`GEMINI_API_KEY`, `DATABASE_URL`, S3 credentials, session secrets) are never exposed to generated applications.
- **Dependency Policy**: Only explicitly approved runtime dependencies (React, Tailwind CSS, Lucide icons) are allowed. Unknown dependencies trigger `PREVIEW_DEPENDENCY_NOT_ALLOWED`.
- **Authorization**: Strict project ownership checks (`userId` verification) apply to all start, stop, status, and artifact endpoints (IDOR protection yielding 403/404).
