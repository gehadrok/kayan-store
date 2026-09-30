# KAYAN AI — PHASE 9: EXTERNAL BUILD ORCHESTRATION FOUNDATION

## 1. Control Plane vs. Build Plane Architecture
Kayan Store operates exclusively as the **Control Plane** (managing specifications, architecture plans, PIR validation, artifact packaging, and build job orchestration).
The **Build Plane** is delegated to isolated external environments (e.g., GitHub Actions or dedicated build services) without executing generated code or installing generated dependencies inside the Kayan Store Node.js server.

## 2. Build Orchestrator & Provider Abstraction
- **`ExternalBuildProvider`**: Generic interface supporting `createBuild(request)`, `getBuildStatus(buildId)`, `cancelBuild(buildId)`.
- **`GitHubActionsBuildProvider`**: Implements the external build adapter foundation. If unconfigured, reports `EXTERNAL_BUILDER_NOT_CONFIGURED` (*"بيئة البناء الخارجية غير مهيأة حاليًا."*).

## 3. Security Boundaries & Secret Isolation
- **No Secret Forwarding**: Host secrets (`GEMINI_API_KEY`, `DATABASE_URL`, S3 keys, admin/user session secrets) are never forwarded to external builders or generated projects.
- **Dependency & Script Policy**: Package manifests are inspected prior to submission; forbidden lifecycle scripts (`preinstall`, `install`, `postinstall`) are flagged.
- **IDOR Protection**: Strict ownership checks (`userId` verification) protect all build submission, status, cancellation, and artifact retrieval endpoints (yielding 403/404 on unauthorized access).
