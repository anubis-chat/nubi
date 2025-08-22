# ElizaOS Workspace Rules

These rules govern how we build, test, and operate this ElizaOS-based project. They are grounded in the official ElizaOS docs and this repo’s current implementation.

Key references in this repo:
- Plugin entry: `src/nubi-plugin.ts` and `src/plugin.ts`
- Providers: `src/providers.ts` and `src/providers/*`
- Evaluators: `src/evaluators/*`
- Services: `src/services/*`
- Config: `src/config/environment.ts`, `src/config/yaml-config-manager.ts`
- Sessions routes: `src/routes/sessions-routes.ts` (mounted in `nubi-plugin.routes`)
- Scripts and tooling: `package.json`

Official docs (selected):
- Core Concepts: Agents, Plugins, Projects, Architecture, Runtime, Services
- Bootstrap: Message flow, Examples, Testing, Complete Developer Guide
- Guides: Sessions API, Compose State, Socket.IO, MCP setup, Plugin Developer/Publishing/Schema
- Plugins: LLM (OpenAI), SQL, Knowledge, Platform (Discord/Telegram)

---

## 1) Golden Principles
- **Security-first**: run security evaluators first; never execute unvalidated user inputs.
- **Single source of truth**: register all components in `src/nubi-plugin.ts`.
- **Separation of concerns**: Actions do orchestration; Services do I/O/integrations; Providers/evaluators do state/analysis.
- **State before action**: build context with `runtime.composeState`/providers prior to response/action logic.
- **Performance-aware**: keep providers small, memory queries bounded, and model usage cost-aware.

## 2) Repository Structure & Conventions
- **Actions**: `src/actions/` ➜ register in `nubi-plugin.actions` via `withActionMiddleware(...)`.
- **Providers**: `src/providers/` ➜ export `Provider` objects; add to `nubi-plugin.providers`.
- **Evaluators**: `src/evaluators/` ➜ add to `nubi-plugin.evaluators` (security first).
- **Services**: `src/services/` ➜ long-running/background tasks and integrations; add to `nubi-plugin.services`.
- **Config**: `src/config/` ➜ environment + YAML config management.
- **Routes**: `src/routes/` ➜ HTTP endpoints (Sessions API included) and health checks.
- **Schemas/Repos**: `src/schemas/`, `src/repositories/` when using SQL plugin + repository pattern.

## 3) Plugin Wiring (`src/nubi-plugin.ts`)
- **Models**: keep `TEXT_SMALL`, `TEXT_LARGE`, `TEXT_EMBEDDING` aligned with LLM plugin config.
- **Actions**: cheap `validate()`, side-effecting `handler()`; expose concise `examples`.
- **Evaluators**: order matters (e.g., `securityEvaluator` first); keep `alwaysRun` minimal.
- **Providers**: prefer `dynamic: true` for request-scoped context; return `{ text, values, data }`.
- **Services**: provide clear names (used by health route); isolate platform/IO logic here.
- **Routes**: mount Sessions API, keep `/health` non-sensitive and stable.
- **Events**: keep lightweight; offload to services when possible.

## 4) Actions: Rules of Engagement
- **Shape**: `{ name, similes, description, validate(), handler(), examples }`.
- **Validation**: avoid self-triggers (`message.entityId === runtime.agentId`); use cheap checks.
- **Handler**: use `callback({ text, action })` for user-visible output; return `ActionResult` with `success`.
- **Middleware**: always wrap with `withActionMiddleware` for mention parsing and normalization.
- **State**: retrieve state via providers; limit `runtime.getMemories` reads (bounded `count`, proper table).

## 5) Providers: Context & State
- **Contract**: `Provider` with `get(runtime, message, state) => ProviderResult`.
- **Result**: keep `text` short; `values` for flags/metrics; `data` for raw items with bounds.
- **Performance**: cap memory queries; prefer summarization over full payloads.
- **Dynamic vs static**: mark `dynamic: true` for per-request; static providers must cache internally.

## 6) Evaluators: Analysis & Post-processing
- **Order**: place security filters first; then session/personality/community evaluators.
- **Frequency**: sample (e.g., ~1/3) or `alwaysRun: false` when possible to control cost.
- **Side effects**: write metrics/state via services; avoid heavy I/O inline.

## 7) Services: Background & Integrations
- **Purpose**: encapsulate integrations (Telegram/Discord), analytics, scheduling, realtime.
- **Lifecycle**: register in `nubi-plugin.services`; provide stable names for `runtime.getService()`.
- **Boundaries**: actions call services instead of libraries directly.
- **Reliability**: add retries/backoff and error isolation; never block critical message flow.

## 8) State Composition (`composeState`)
- **Usage**: call `runtime.composeState(message, opts)` to aggregate providers.
- **Selection**: specify providers as needed; avoid pulling all providers by default.
- **Caching**: follow compose-state guide for cache/refresh semantics; keep TTL short for dynamic data.

## 9) Message Flow (Bootstrap)
- **Flow**: reception → self-check → run tracking → memory write → attachments → shouldRespond → response generation → validation → actions → evaluators.
- **Templates**: if customizing should-respond/message templates, document rationale and add tests.
- **Timeouts**: use sensible timeouts and guardrails per Bootstrap optimizations.

## 10) Sessions API
- **Routes**: ensure Sessions routes are mounted in `nubi-plugin.routes`.
- **Lifecycle**: implement/observe timeout, renewal, heartbeat; persist/recover state appropriately.
- **Clients**: document required message formats and room/session IDs.

## 11) LLM Configuration
- **Plugins**: configure `@elizaos/plugin-openai` (and others) with environment variables.
- **Embeddings**: always configure an embedding model and fallback strategy; ensure `TEXT_EMBEDDING` aligns.
- **Cost control**: prefer small models for routine tasks; stream or chunk for large responses.

## 12) Knowledge (RAG)
- **Ingestion**: use `@elizaos/plugin-knowledge`; only supported types; batch and validate retrieval.
- **Context**: keep retrieved context scoped and deduplicated; measure hit rates and quality.

## 13) SQL & Persistence
- **Adapters**: use SQL plugin adapters; avoid direct driver coupling in actions.
- **Schema**: keep shared schemas in `src/schemas/`; use repository pattern under `src/repositories/`.
- **Migrations**: prefer dynamic migration flow; test up/down; version changes.

## 14) Environment & Secrets
- **Required**: `OPENAI_API_KEY` (validated in `src/config/environment.ts`).
- **Optional**: `TELEGRAM_BOT_TOKEN`, `DISCORD_API_TOKEN`, Twitter keys, `DATABASE_URL`.
- **NUBI settings**: `RAIDS_ENABLED`, `AUTO_RAIDS`, `RAID_INTERVAL_HOURS`, `MAX_CONCURRENT_RAIDS`, `RAID_DURATION_MINUTES`, `MIN_RAID_PARTICIPANTS`.
- **Policy**: do not commit secrets; keep `.env.example` updated when adding new variables.
- **Validation**: fail fast if required env is missing; enforce valid `LOG_LEVEL`.

## 15) Tooling & Commands
- **Dev**: `bun run dev` (elizaOS dev).
- **Start**: `bun run start` (prod) or `bun run start:production`.
- **Build**: `bun run build` (tsc + vite + tsup); zero `tsc` errors.
- **Quality**: `bun run check-all` (type-check, format:check, tests) must pass in CI.
- **Format**: `bun run format` and `format:check` with Prettier.
- **Tests**: `bun run test`, `test:watch`, `test:coverage`.

## 16) Testing Strategy
- **Unit**: actions/providers/evaluators with mocks (Bootstrap testing utilities).
- **Integration**: message flow, services, routes, sessions.
- **Edge cases**: attachment handling, timeouts, rate limits, provider failures.
- **Determinism**: seed random sampling in evaluators for stable tests where applicable.

## 17) Performance Budgets
- **Providers**: < 50ms typical; keep memory reads `count` small (e.g., <= 20–50).
- **Actions**: first token < 1s for routine responses; stream for long outputs.
- **Evaluators**: avoid cascading LLM calls; cap at 1 per message unless required.
- **Services**: non-blocking; backpressure when integrations are slow.

## 18) Security & Compliance
- **Evaluator-first**: security evaluator runs first in `nubi-plugin.evaluators`.
- **Validation**: sanitize inputs; whitelist outbound calls; never echo secrets.
- **Rate limiting**: per-route/platform; shield against abuse.
- **Logging**: use `logger` (no `console`); never log secrets; honor `LOG_LEVEL`.

## 19) Observability & Health
- **Health endpoint**: keep `/health` minimal, no secrets; include service presence flags.
- **Metrics**: use an analytics service for async logging/metrics; avoid blocking critical paths.

## 20) CI/CD & Reviews
- **Gates**: CI must run `check-all`. PRs fail on type or format errors.
- **Review**: enforce rules in this document; add targeted tests for behavior changes.
- **Versioning**: semver in `package.json`; changelog entries for user-facing changes.

## 21) Publishing & Distribution
- **Follow**: ElizaOS plugin publishing guide (pre-publish validation, images/docs, versioning).
- **Docs**: keep README/USAGE updated for new actions/providers/services.

## 22) Local Development Tips
- **YAML config**: loaded in `nubi-plugin` init via `YAMLConfigManager`; validate required fields (`agent.name`).
- **Feature flags**: see `getFeatureAvailability()` in `src/config/environment.ts`.
- **Socket.IO**: ensure correct event names/rooms and message formats per guide if used.

---

## Pull Request Review Checklist
- **Structure**: new components live in correct directories and are registered in `src/nubi-plugin.ts`.
- **Security**: security evaluator order preserved; inputs validated; no secrets in logs.
- **State**: providers are efficient and scoped; composeState used appropriately.
- **Performance**: provider/action/evaluator budgets respected; memory queries bounded.
- **Testing**: unit + integration tests added/updated; mocks used for external deps.
- **Tooling**: `check-all` passes; zero `tsc` errors; Prettier clean.
- **Docs**: `.env.example` updated; rules not violated; README/usage updated if needed.

---

## Maintenance Policy
- Any new integration (LLM/provider/platform) must:
  - Add env variables to `.env.example` and validation to `environment.ts` if required.
  - Provide tests and documentation.
  - Expose a service (if long-running) and wire via `nubi-plugin.services`.
- Any change to message flow or templates must update corresponding tests.

This document is authoritative for contributor behavior and CI policy in this ElizaOS workspace.
