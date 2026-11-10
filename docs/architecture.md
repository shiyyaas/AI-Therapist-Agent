# Architecture & System Design

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client["React Frontend (SPA / Vite)"] -->|"HTTPS / Bearer ID Token"| Backend["Node.js / Express Backend"]
    Client -->|"Direct SDK (Read/Write Ownership)"| Firestore[("Cloud Firestore")]
    Client -->|"Auth State / Token"| FirebaseAuth["Firebase Authentication"]
    Backend -->|"Admin SDK (Bypass rules for system ops)"| Firestore
    Backend -->|"Two-Tier Safety Classification & Generation"| Gemini["Google Gemini API (gemini-2.5-flash)"]
```

---

## 2. Request & Safety Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Frontend
    participant API as Express Backend
    participant Safety as Safety Classifier (Regex + AI)
    participant Gemini as Google Gemini API
    participant DB as Cloud Firestore

    User->>UI: Enters message & submits
    UI->>UI: Optimistic message append
    UI->>API: POST /api/chat (Bearer Token, message, sessionId)
    API->>API: Verify ID token & session ownership
    API->>Safety: Tier 1: Regex & Keyword evaluation
    alt Deterministic Crisis detected
        Safety-->>API: Crisis Flagged (suicide / self-harm / violence)
    else Regex Safe
        API->>Safety: Tier 2: Gemini strict JSON risk classification
        Safety-->>API: Risk Assessment
    end

    alt Crisis Risk Confirmed
        API->>DB: Save user message (safetyFlag: true)
        API->>DB: Update session riskLevel to "crisis"
        API->>DB: Save fixed emergency response
        API-->>UI: 200 OK (Fixed crisis text, safetyFlag: true, 988 resources)
        UI->>UI: Display Urgent Safety Panel & emergency buttons
    else Safe Conversation
        API->>DB: Save user message (safetyFlag: false)
        API->>Gemini: Generate empathetic companion response
        Gemini-->>API: Empathetic response
        API->>DB: Save assistant message
        API-->>UI: 200 OK (Assistant response, safetyFlag: false)
    end
```

---

## 3. Firestore Data Model & Access Boundaries

### Collection: `users/{userId}`
- **Permissions:** Owner only (`request.auth.uid == userId`).
```typescript
interface UserDoc {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: Timestamp;
}
```

### Collection: `sessions/{sessionId}`
- **Permissions:** Owner only. Client cannot modify `uid`, `createdAt`, or inject server-controlled `riskLevel`.
```typescript
interface SessionDoc {
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

### Subcollection: `sessions/{sessionId}/messages/{messageId}`
- **Permissions:** Owner only. Client cannot write `safetyFlag: true` or `crisisType`.
```typescript
interface MessageDoc {
  role: "user" | "assistant";
  text: string;
  safetyFlag: boolean;
  crisisType: string | null;
  createdAt: Timestamp;
}
```

### Subcollection: `sessions/{sessionId}/summary/latest`
- **Permissions:** Client read-only. Client write denied (`allow write: if false`). Only written by server via Firebase Admin SDK.
```typescript
interface SessionSummaryDoc {
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

## 4. Deployment Topology

```mermaid
graph LR
    Browser["Web Browser (User)"] -->|"HTTPS / Static Assets"| FirebaseHosting["Firebase Hosting"]
    Browser -->|"API Requests /api/*"| CloudRun["Google Cloud Run (Containerized Backend)"]
    CloudRun -->|"gRPC / HTTPS"| Firestore[("Cloud Firestore")]
    CloudRun -->|"HTTPS (API Key)"| GeminiStudio["Google AI Studio / Gemini API"]
```
