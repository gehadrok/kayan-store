# KAYAN AI WORKSPACE — PHASE 3 ARCHITECTURE & USER EXPERIENCE DOCUMENTATION

## 1. Executive Overview
Kayan AI Workspace (Phase 3) provides a professional, full-featured user interface for interacting with the server-side Kayan AI Engine. Built directly on top of the Phase 2 / Phase 2.6 verified architecture, it delivers a studio workspace for text generation, high-fidelity image synthesis, structured code generation with ZIP export, project management, asset galleries, and prompt templates.

---

## 2. Workspace Routes & Navigation
- `/ai`: Main studio workspace entry point. Enforces authentication (`requireUser`).
- Sub-navigation within `/ai` supports:
  - **Overview (`overview`)**: Studio quick stats, total jobs, total assets, and quick capability launcher.
  - **Generation Composer (`generate`)**: Interactive `AIComposer` for Text, Image, Code, and Video (Coming Soon).
  - **History (`history`)**: Historical log of jobs (`AIHistoryTable`) with capability and status filters.
  - **Assets Gallery (`assets`)**: Visual gallery (`AIAssetGallery`) displaying generated images and code artifacts with SHA-256 verification.
  - **Prompt Library (`prompts`)**: Prompt template repository (`AIPromptLibrary`) for single-click injection into the composer.

---

## 3. UI Component Architecture

```
AIWorkspacePage (/ai)
   ├── Studio Navigation & Header (User Auth Status)
   ├── Left Studio Sidebar
   │     ├── AIProjectModal ("+ مشروع جديد")
   │     └── My Projects List (GET /api/ai/projects)
   └── Main Studio Panel
         ├── Project Banner
         ├── Overview Dashboard
         ├── AIComposer Component
         │     ├── AIJobStatus (Lifecycle Indicator)
         │     ├── Capability Selectors (TEXT, IMAGE, CODE, VIDEO)
         │     ├── Model & Aspect Ratio Selectors
         │     ├── Formatted Result Viewers (Text, Image, Code File Tree + Monospace Viewer)
         │     └── ZIP Download Action (POST /api/ai/download-zip)
         ├── AIHistoryTable Component (GET /api/ai/projects/:id/jobs)
         ├── AIAssetGallery Component (GET /api/ai/projects/:id/assets)
         └── AIPromptLibrary Component (Prompt Templates)
```

---

## 4. API & Backend Integration
The UI interacts strictly with server-side Express endpoints:
1. `GET /api/ai/projects`: Retrieves user-owned AI projects.
2. `POST /api/ai/projects`: Creates a new AI project (`name`, `description`, `type`).
3. `POST /api/ai/generate/text`: Text generation through `aiGateway.generateText()`.
4. `POST /api/ai/generate/image`: Image generation through `aiGateway.generateImage()` and `artifactStorage.saveMediaFile()`.
5. `POST /api/ai/generate/code`: Code generation returning structured multi-file code.
6. `POST /api/ai/download-zip`: Generates clean in-memory ZIP archive from code files without filesystem write.
7. `GET /api/ai/projects/:projectId/jobs`: Fetches job history for the active project.
8. `GET /api/ai/projects/:projectId/assets`: Retrieves project media and code assets.

---

## 5. Security & Isolation Controls
- **Zero API Key Leakage**: No Gemini or S3 API keys are imported, bundled, or accessible in client-side React code or network responses.
- **Backend IDOR Protection**: Project and Job routes validate `project.userId === user.id`. Users cannot access or mutate resources belonging to other users.
- **Path Sanitization**: Code file paths and ZIP download names strip path traversal sequences (`..`), leading slashes, and null bytes (`\x00`).
- **Zero Code Execution**: Generated code is displayed in read-only viewers and is never evaluated or executed server-side or client-side.

---

## 6. Error Presentation & Retry Workflow
Backend errors are caught and presented as user-friendly Arabic status banners:
- `AI_PROVIDER_NOT_CONFIGURED`: "مزود الذكاء الاصطناعي غير مهيأ حالياً."
- `429` (`RESOURCE_EXHAUSTED`): "تم تجاوز حصة التوليد المؤقتة لمزود الذكاء الاصطناعي. يرجى الانتظار ثم المحاولة مجدداً."
- `503` (`UNAVAILABLE`): "مزود الذكاء الاصطناعي يواجه ضغطاً كبيراً حالياً."
- `401` / `403`: "غير مصرح لك بالوصول أو التوليد على هذا المشروع."

**Retry Policy**: Zero automatic infinite retry loops. Retries are strictly user-triggered via an explicit "إعادة المحاولة" button.

---

## 7. Responsive Design & RTL/LTR Configuration
- **RTL First**: Primary layout sets `dir="rtl"` with Arabic typography.
- **Responsive Layout**:
  - **Desktop (1024px+)**: 4-column studio layout (1-column sidebar + 3-column workspace).
  - **Tablet (768px - 1023px)**: Adaptive 2-column studio layout.
  - **Mobile (< 768px)**: Responsive 1-column layout.
- **Design System Consistency**: Uses Kayan Store slate/sky styling tokens matching the overall brand identity.

---

## 8. Future Extension Points
- **Veo Video Generation**: Capability tab currently renders a "Coming Soon" badge. The backend contract leaves room for `POST /api/ai/generate/video`.
- **AI App Builder**: Future workspace integration for full-stack application scaffolding.
