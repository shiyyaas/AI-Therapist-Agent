# Phase 2: Crisis Safety, Session History Controls, and AI Session Summaries

## Overview
Phase 2 elevates the AI Wellness Companion MVP into a safer, more actionable support tool. It introduces a two-tier server-side crisis detection engine, emergency-resource escalation, comprehensive session history controls, structured AI-generated end-of-session summaries with practical coping steps, and strict Firestore authorization rules.

> **Important Safety & Medical Disclaimer:** This web application is an AI wellness companion, not a licensed therapist, psychiatrist, medical doctor, or emergency crisis center. It does not diagnose mental health disorders, provide psychiatric treatment, or replace human healthcare professionals. If a user is experiencing an emergency, suicidal thoughts, or immediate danger, they must contact local emergency services (such as 911 or 988 in the U.S.) immediately.

---

## 1. Crisis Detection Architecture

Crisis safety uses a two-tier defense-in-depth model:

```
[ User Message ]
       │
       ▼
┌──────────────────────────────────────────────┐
│ Tier 1: Deterministic Regex & Keyword Filter │
│ (backend/src/safety/crisis-detector.ts)      │
└──────────────────────────────────────────────┘
       │
       ├─► [Crisis detected] ──────────────────────────┐
       │                                               │
       ▼                                               │
┌──────────────────────────────────────────────┐       │
│ Tier 2: Strict Gemini Risk Classifier        │       │
│ (backend/src/safety/gemini-classifier.ts)    │       │
└──────────────────────────────────────────────┘       │
       │                                               │
       ├─► [Crisis detected / Malformed fallback] ────┤
       │                                               │
       ▼ [Safe]                                        ▼ [Crisis]
┌─────────────────────────────────┐   ┌──────────────────────────────────────────┐
│ Generate Empathetic Companion   │   │ Intercept & Return Fixed Safety Response │
│ Response via Google Gemini      │   │ • 988 Lifeline (Call/Text) & 911         │
└─────────────────────────────────┘   │ • Mark Message & Session as "crisis"     │
                                      │ • Do NOT call normal AI generator        │
                                      │ • Display Urgent Safety Panel in UI      │
                                      └──────────────────────────────────────────┘
```

### Risk Level Definitions
- **`none`:** Everyday stressors, routine emotional reflection, work/school fatigue, colloquial phrases ("my feet are killing me", "I died laughing", "that test was brutal").
- **`elevated`:** Heightened sadness, passive death wishes without plan/intent, or intense non-imminent distress. Empathy and professional counseling encouragement provided.
- **`crisis`:** Immediate intent, planning, or execution of suicide, active self-harm/injury, intentional overdose/poisoning, immediate physical danger, domestic abuse in progress, or violence against others.

### Tier 1: Deterministic Pattern Detector
Evaluates messages using strict regular expressions to avoid false positives on words like "hurt", "dead", "kill", or "stress" unless paired with self-harm, suicidal intent, or violence:
- `suicide`: "want to kill myself", "going to end my life", "better off dead", "no reason to live".
- `self_harm`: "urge to cut myself", "cannot stop cutting myself", "burn myself".
- `overdose`: "swallowed a bottle of painkillers", "lethal amount of pills", "intentional overdose".
- `immediate_danger`: "in immediate danger", "someone is trying to kill me", "fear for my life right now".
- `violence`: "going to kill my boss", "bringing a weapon to work".
- `abuse`: "partner is beating me right now", "being held hostage".

### Tier 2: Strict Gemini Classifier
Sends user text to Gemini with a dedicated prompt requesting JSON:
```json
{
  "riskLevel": "none" | "elevated" | "crisis",
  "reason": "brief explanation",
  "categories": ["self_harm", "suicide", "violence", "abuse", "other"]
}
```
- **Fallback policy:** If Gemini classification fails, times out, or produces invalid JSON, the system safely falls back to the deterministic Tier 1 result. A deterministic `crisis` is never downgraded.

### Crisis Escalation Behavior
When crisis risk is detected:
1. Normal therapeutic AI generation is **bypassed entirely**.
2. User message is saved with `safetyFlag: true` and `crisisType`.
3. Session doc is updated with `riskLevel: 'crisis'`.
4. Fixed, non-AI safety response is returned with 988 Lifeline, 911, and support guidance.
5. Frontend renders the **Urgent Safety Panel** above the conversation.

---

## 2. Always-Visible Urgent Help
On all chat screens, an always-visible **"I need urgent help now"** button is present. When clicked, it opens a modal containing:
- **Call 988 (U.S. & Canada)** — One-touch voice call.
- **Text 988 (U.S. & Canada)** — Free 24/7 SMS connection.
- **Chat Online at 988 Lifeline** — Secure web chat at `988lifeline.org`.
- **Call 911** — Local emergency dispatch.
- **Trusted person guidance** — Advice to contact family, friends, or a doctor and avoid being alone.
- **App disclaimer** — Reminder that the app is not an emergency service.

---

## 3. Session History Controls
The session sidebar includes:
- **Session Search:** Real-time filter across session titles and message contents.
- **Inline Rename:** Users can edit session titles with an in-place input and validation.
- **Session Deletion:** Requires explicit confirmation via modal and executes an optimistic UI deletion with automatic rollback if the API fails.
- **Cascading Delete:** Deleting a session cascades deletion to all messages and summary subcollections.
- **Status Indicators:** Clear badges distinguishing **Active** sessions from **Ended** sessions.

---

## 4. End-of-Session AI Summaries

Users can click **"End session"** in the active chat view. After confirming ("End this session and generate a summary?"), the backend generates a structured summary via Gemini.

### Summary JSON Schema
```json
{
  "overview": "string",
  "emotionalThemes": ["string"],
  "strengths": ["string"],
  "copingSteps": ["string"],
  "followUp": "string",
  "riskNote": "string"
}
```

### Summary Requirements
- Compassionate, non-clinical tone without diagnosing or labeling pathology.
- Does not hallucinate unmentioned events.
- 2–4 recurring emotional themes supported by the transcript.
- 1–3 personal strengths or insights observed.
- 3–5 practical coping steps (e.g., 4-7-8 breathing, 5-4-3-2-1 grounding, journaling).
- Follow-up recommendation to seek human professional care when distress is persistent.
- Immediate human resource escalation in `riskNote` if crisis indicators were detected.

### Summary UI Features
- Card layout:
  - *What we discussed*
  - *Emotional themes*
  - *Strengths & Insights*
  - *Coping steps to try*
  - *Next steps*
- Prominent medical disclaimer banner.
- "Copy summary" button with clipboard feedback.
- Graceful error state with a "Retry Summary" button that preserves the transcript.

---

## 5. Updated Firestore Data Model

### `users/{userId}`
```typescript
{
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: Timestamp;
}
```

### `sessions/{sessionId}`
```typescript
{
  uid: string;
  title: string;
  status: "active" | "ended";
  riskLevel: "none" | "elevated" | "crisis";
  endedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
}
```

### `sessions/{sessionId}/messages/{messageId}`
```typescript
{
  role: "user" | "assistant";
  text: string;
  safetyFlag: boolean;
  crisisType: string | null;
  createdAt: Timestamp;
}
```

### `sessions/{sessionId}/summary/latest`
```typescript
{
  overview: string;
  emotionalThemes: string[];
  strengths: string[];
  copingSteps: string[];
  followUp: string;
  riskNote: string;
  generatedAt: Timestamp;
}
```

---

## 6. Updated API Contract

### `POST /api/chat`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Request Body:** `{ "sessionId": string, "message": string }`
- **Response (Safe):**
  ```json
  {
    "role": "assistant",
    "text": "Empathetic response...",
    "safetyFlag": false,
    "riskLevel": "none",
    "createdAt": "2025-03-12T10:00:00.000Z"
  }
  ```
- **Response (Crisis Escalation):**
  ```json
  {
    "role": "assistant",
    "text": "Your safety matters... Call or text 988...",
    "safetyFlag": true,
    "crisisType": "suicide",
    "riskLevel": "crisis",
    "createdAt": "2025-03-12T10:00:00.000Z"
  }
  ```

### `PATCH /api/chat/sessions/:sessionId`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Request Body:** `{ "title": "New Title" }`
- **Response:** `200 OK` with updated session document.

### `DELETE /api/chat/sessions/:sessionId`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Response:** `200 OK` `{ "success": true, "message": "Session deleted successfully." }`

### `GET /api/chat/sessions?search=<query>`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Response:** `200 OK` `{ "sessions": Session[] }` filtered by title and message content.

### `POST /api/chat/sessions/:sessionId/summary`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Response:** `200 OK` with `SessionSummary` JSON. Updates session `status` to `ended` and saves to `sessions/{sessionId}/summary/latest`.

### `GET /api/chat/sessions/:sessionId/summary`
- **Headers:** `Authorization: Bearer <ID_TOKEN>`
- **Response:** `200 OK` with stored `SessionSummary` or `404 Not Found`.

---

## 7. Privacy & Logging Policy
- **No Sensitive Disclosures Logged:** Raw crisis disclosures, suicide threats, or trauma details are **never** logged to server stdout or monitoring systems.
- **Operational Metadata Only:**
  ```json
  {
    "sessionId": "abc-123",
    "riskLevel": "crisis",
    "shownCrisisResources": true,
    "errorType": "SummaryGenError"
  }
  ```

---

## 8. Manual Test Checklist
1. **Crisis Trigger Test:** Send "I want to kill myself" in chat. Verify that:
   - Fixed safety response is returned immediately.
   - Urgent Safety Panel displays above chat with 988 button.
   - Normal AI response is bypassed.
2. **Benign Phrasing Test:** Send "My feet are killing me" and "I died laughing". Verify normal empathetic response is given without crisis flags.
3. **Always-Visible Button Test:** Click "I need urgent help now" at any time. Verify modal opens with 988 voice/SMS, 988 web chat, 911, and trusted person options.
4. **Session Rename Test:** Use session menu to rename session. Verify title updates in sidebar and Firestore.
5. **Session Delete Test:** Click delete on a session. Confirm modal appears. Confirm deletion. Verify session and messages are deleted from Firestore.
6. **Session Search Test:** Enter keywords into sidebar search. Verify list filters correctly.
7. **End Session & Summary Test:** Click "End session", confirm dialog. Verify summary cards appear (What we discussed, themes, strengths, coping steps, next steps) and session status changes to "Ended".
8. **Summary Copy Test:** Click "Copy summary". Verify clipboard contains complete structured summary.

---

## 9. Known Limitations & Phase 3 Scope
- Multi-lingual crisis detection support (currently English-optimized).
- Real-time geolocation routing to localized regional distress hotlines outside the U.S./Canada.
- Automated longitudinal mood tracking and check-in push notifications.
- EHR / clinical therapist export integrations.
