# Phase 3: Production Hardening, Reliability, Safety UX, Accessibility & Deployment Readiness

## Overview
Phase 3 transitions the AI Wellness Companion from a working prototype into a robust, secure, resilient, and demo-ready web application suitable for public code review and controlled production deployment.

---

## 1. Summary of Changes in Phase 3

### Safety & Crisis Escalation Hardening
- **Categorized Server-Side Fixed Responses:** Implemented distinct fixed crisis responses in `backend/src/safety/crisis-detector.ts` for:
  - Immediate physical danger / self-harm emergency (advising 911 / emergency services and immediate safe location).
  - Urgent suicidal distress (988 Lifeline voice/SMS/chat and trusted person).
  - Violence / harm to others (de-escalation, creating distance, emergency dispatch).
- **Persistent Help Access:** Permanently visible **"I need urgent help now"** button accessible across desktop and mobile viewports.
- **Enhanced Urgent Help Modal:** Prominent 988 voice/text links, online chat, 911 emergency dispatch, trusted person guidance, and an explicit international guidance note (`findahelpline.com`).
- **Acknowledged Crisis Panel:** Updated `UrgentSafetyPanel.tsx` with an "I understand" acknowledgment action that collapses into a non-intrusive safety bar without deleting emergency options or lowering session risk state.

### Reliability & Error Handling
- **API Client Hardening:** In `frontend/src/lib/api.ts`, added structured error classification (Network, 401 token refresh/expired, 403 forbidden, 404 not found, 429 rate limit, 500 server error, 502 Gemini failure), timeout handling via `AbortController`, and sanitization of raw errors.
- **Active Session Persistence:** Session ID is saved to `localStorage` and automatically restored across browser refreshes.
- **Optimistic UI with Clean Rollback:** If message send or session rename/delete fails, local state cleanly reverts to prior state and restores user draft without silent data loss.
- **Firestore Offline / Sync Recovery:** Display non-sensitive connection warnings and retry controls when Firestore listeners fail or disconnect.

### Security, Rate Limiting & Privacy
- **Strict Firestore Security Rules (`firestore.rules`):**
  - Owner-only access enforced across profiles, sessions, messages, and summaries.
  - Immutability of document IDs, `uid`, and `createdAt` timestamps.
  - Client writes cannot tamper with `riskLevel`, `safetyFlag`, `crisisType`, or `summary` subcollections (summary writes restricted to Admin SDK).
  - Prevention of collection enumeration and cross-user snooping.
- **Backend Rate Limiting & Input Validation:**
  - Token/IP rate limiter on `POST /api/chat` (30 req/min) and `POST /api/chat/sessions/:id/summary` (5 req/5min) returning HTTP 429 with `Retry-After`.
  - Max length enforcement: user messages (4,000 chars), session titles (100 chars), search queries (100 chars).
  - Rejection of empty or whitespace-only inputs.
  - CORS policy restricted to configured origins and local development.
  - Unrevealing container health check at `GET /healthz`.
- **Privacy Notice:** Introduced `PrivacyNoticeModal.tsx` and in-app privacy documentation explaining data collection, Firestore persistence, cascading deletion, and clear boundaries of non-clinical care.

### Accessibility (a11y) & UX Polish
- **Accessible Chat Elements:** Semantic `<article>`, `<main>`, `<aside>`, and `<time>` tags; live regions (`aria-live="polite"`) for AI typing feedback; accessible names on all icon buttons.
- **Keyboard Navigation & Modal Focus Traps:** `Escape` key support on all modals, focus trapping, and focus restoration to the trigger element upon closing.
- **Multiline Chat Input:** Auto-expanding textarea up to 160px with `Enter` (send) and `Shift+Enter` (newline).
- **Auto-scroll & Jump Control:** Smooth auto-scrolling with smart detection: when a user scrolls up to review prior messages, an accessible "Jump to latest message" button appears.

---

## 2. Testing Strategy
- **Backend Test Suite (Vitest):**
  - Rate limiting behavior and 429 status code validation.
  - Input length and whitespace rejection tests.
  - Ownership validation and 403 enforcement across all session and message endpoints.
  - True-positive crisis phrases (`"I have a plan to end my life tonight."`, `"I'm going to hurt someone when they get home."`).
  - False-positive benign phrases (`"I'm dying to see that movie."`, `"This deadline is killing me."`).
  - Gemini failure fallback and timeout simulation.
  - Container health check at `/healthz`.
- **Frontend Test Suite (Vitest + React Testing Library):**
  - Disclaimer banner compliance.
  - Urgent help modal resources, international guidance, and keyboard accessibility.
  - Chat input keyboard triggers (Enter vs Shift+Enter) and character counters.
  - Summary modal copy-to-clipboard and error retry flows.

---

## 3. Deployment Configuration
- **Backend:** Packaged with multi-stage Dockerfile (`backend/Dockerfile`) targeting Google Cloud Run.
- **Frontend:** Configured with `firebase.json` for Firebase Hosting or Google Cloud Run CDN.
- **CORS:** Configured via `CLIENT_URL` environment variable.

---

## 4. Features Intentionally Deferred Beyond Phase 3
1. **Streaming Responses:** Streaming assistant output progressively requires Server-Sent Events (SSE) or WebSockets across the full Express-to-React chain. Deferred to retain strict deterministic crisis detection and JSON validation before any token is rendered to the user.
2. **Multi-language Crisis Interception:** The deterministic crisis regex catalog is currently optimized for English expressions.
3. **EHR / Clinical Healthcare Integration:** Out of scope as this application explicitly does not provide clinical care or HIPAA-covered medical records.
