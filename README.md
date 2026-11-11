# AI Wellness Companion

A secure, accessible, and privacy-preserving AI Wellness Companion web application providing compassionate, non-judgmental conversational reflection and grounding exercises. Features anonymous guest mode and authenticated accounts, persistent Firestore session history, two-tier deterministic and AI safety filters, and structured end-of-session takeaways.

> **CRITICAL DISCLAIMER:** This application is an automated conversational tool, **not a human therapist, medical doctor, or emergency psychiatric service**. It does not diagnose mental health conditions or provide medical treatment. If you or someone you know is in immediate danger, having thoughts of self-harm, or experiencing a crisis, contact local emergency services (**911**) or the Suicide & Crisis Lifeline (**call or text 988** in the U.S. and Canada) immediately.

---

## Architecture Overview

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Firebase Web SDK (v10).
- **Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Google Gen AI SDK (`@google/genai`).
- **Database & Auth:** Cloud Firestore, Firebase Authentication (Anonymous & Email/Password).
- **AI Model:** Google Gemini (`gemini-2.5-flash` default, configurable via `GEMINI_MODEL`).
- **Target Topology:** Google Cloud Run (Backend container) + Firebase Hosting (Frontend static SPA).

---

## Security & Safety Features

1. **Two-Tier Crisis Safety Engine:**
   - **Tier 1 (Deterministic):** Fast regular expressions detect active suicidal intent, self-harm, overdose, abuse, and violence while allowing benign colloquial expressions (*"this deadline is killing me"*, *"I died laughing"*).
   - **Tier 2 (Gemini Classifier):** Strict JSON risk classification that never downgrades deterministic crisis triggers.
   - **Emergency Escalation:** Returns fixed, pre-approved server-side emergency resources (988 and 911); bypasses normal conversational AI generation.
2. **Access Control & Firestore Security:**
   - Owner-only access enforced on profiles, sessions, and messages.
   - Immutable fields (`uid`, `createdAt`) cannot be modified.
   - Server-controlled fields (`riskLevel`, `safetyFlag`, `crisisType`) cannot be altered by client writes.
   - Session summaries subcollection is client read-only (`allow write: if false`).
3. **Rate Limiting & Input Validation:**
   - 30 requests/minute per IP/user on `/api/chat` (HTTP 429).
   - 5 requests/5 minutes per user on session summarization.
   - Message length limit: 4,000 characters.
   - Session title and search query limit: 100 characters.
   - Whitespace-only messages rejected.
4. **Privacy by Default:**
   - Zero raw crisis text or sensitive trauma narrative logging.
   - Cascading permanent deletion of sessions, messages, and summaries.
   - Container health check endpoint (`GET /healthz`) returns `{ "status": "ok" }` without leaking version or credentials.

---

## Local Setup Guide

### 1. Prerequisites
- **Node.js:** v20+ recommended (v18+ supported)
- **npm:** v9+
- A Google Cloud / Firebase project with **Firestore** and **Firebase Authentication** enabled.
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### 2. Environment Configuration

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=8080
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:8080
```

---

## Running Locally

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## Running Tests & Linting

### Backend
```bash
cd backend
npm test          # Run Vitest test suite (45 tests)
npm run lint      # Run ESLint (0 errors, 0 warnings)
npm run build     # Verify TypeScript build
```

### Frontend
```bash
cd frontend
npm test          # Run Vitest test suite (17 tests)
npm run lint      # Run ESLint (0 errors, 0 warnings)
npm run build     # Run TypeScript check and Vite production build
```

---

## Deployment Guide (Cloud Run + Firebase Hosting)

### 1. Backend: Deploy to Google Cloud Run
Build and deploy the backend container via Docker:
```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-wellness-backend
gcloud run deploy ai-wellness-backend \
  --image gcr.io/PROJECT_ID/ai-wellness-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars CLIENT_URL="https://PROJECT_ID.web.app",GEMINI_MODEL="gemini-2.5-flash" \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

### 2. Frontend: Deploy to Firebase Hosting
```bash
cd frontend
# Set VITE_API_BASE_URL to your Cloud Run URL in frontend/.env.production
npm run build
cd ..
firebase deploy --only hosting,firestore:rules
```

---

## Documentation
- [Phase 1 Specification](docs/phase-1.md)
- [Phase 2 Specification](docs/phase-2.md)
- [Phase 3 Specification](docs/phase-3.md)
- [System Architecture & Flow](docs/architecture.md)
- [Privacy & Safety Policy](docs/privacy-and-safety.md)
- [Design Tokens & UI Reference](docs/DESIGN.md)
