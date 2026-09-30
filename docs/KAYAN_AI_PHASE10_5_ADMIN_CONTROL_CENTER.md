
# Kayan AI Phase 10.5 — Admin Control Center

The AI Admin Control Center provides a centralized interface for managing the AI infrastructure of Kayan Store V2.

## 🔑 Security & Authorization
- **Access Control**: Only users with the `admin` role can access `/admin/ai` or the related API endpoints (`/api/admin/ai/*`).
- **Secret Protection**:
    - Global API keys are managed via environment variables (never exposed to UI).
    - User BYOK (Bring Your Own Key) entries are **encrypted at rest** (AES-256-GCM).
    - Admins only see **masked keys** (e.g., `********`) in the usage/management tables.
- **Audit Logging**: All changes to providers, models, and global settings are recorded in the `activity_logs` table.

## 🛠️ Management Modules

### 1. Provider Registry
- **Supported Types**: GEMINI, OPENAI, ANTHROPIC, OPENROUTER, CUSTOM.
- **Adapter Status**:
    - `LIVE`: Fully implemented and configured with an API key.
    - `NOT_CONFIGURED`: Adapter exists but lacks an API key in the environment.
    - `STUB`: Placeholder adapter (cannot receive production traffic).
- **Actions**: Activate/Deactivate providers, edit metadata, and test connectivity.

### 2. Model Registry
- **Granular Control**: Configure model capabilities (TEXT, IMAGE_GENERATION, etc.), pricing class, and context window limits.
- **Priority System**: Models are sorted by priority during routing (lower number = higher priority).
- **Free Tier Metadata**: Mark models as `FREE`, `PAID`, or `REQUIRES_BILLING` to drive routing policies.

### 3. Routing & Fallback Policies
- **Routing Modes**:
    - `AUTO`: Best balance of speed and reliability.
    - `FREE_FIRST`: Attempts free models first, then falls back according to policy.
    - `USER_SELECTED`: Respects the specific model choice if provided by the user.
    - `PROVIDER_SELECTED`: Prioritizes a specific provider (e.g., Gemini).
- **Self-Healing Fallback**:
    - **Max Retries**: Default is 3 attempts per request.
    - **Trigger Errors**: 429 (Quota), 503 (Unavailable), and timeouts.
    - **Paid Fallback Toggle**: If disabled, the system will NOT silently use a paid model if the free model fails (unless the user has their own key).

### 4. Observability & Stats
- **Usage Dashboard**: Real-time aggregation of success/failure rates per model and capability.
- **Health Monitoring**: Tracks last known status and error categories (e.g., Quota exhausted).

## 📡 API Reference (Admin Only)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/ai/providers` | List all providers with adapter status |
| `PATCH` | `/api/admin/ai/providers/:id` | Update provider status or metadata |
| `GET` | `/api/admin/ai/models` | List the full model registry |
| `POST` | `/api/admin/ai/models` | Register a new model |
| `PATCH` | `/api/admin/ai/settings` | Update global routing/fallback policy |
| `GET` | `/api/admin/ai/usage/stats` | Aggregated AI usage statistics |
