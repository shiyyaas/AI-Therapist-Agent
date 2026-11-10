# AI Wellness Companion

A secure AI Wellness Companion web application providing compassionate, non-judgmental conversational support. Features anonymous and authenticated accounts, persistent Firestore session history, and empathetic responses powered by Google Gemini.

> **Disclaimer:** This application is not a therapist and does not provide medical or psychiatric advice. In emergencies or crises, contact local emergency services immediately.

---

## Architecture Overview

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Firebase Web SDK.
- **Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Google Gen AI SDK (`@google/genai`).
- **Database & Auth:** Cloud Firestore, Firebase Authentication.
- **AI Model:** Google Gemini (`gemini-2.5-flash` default, configurable via `GEMINI_MODEL`).

---

## Prerequisites

- **Node.js:** v18.0.0+ (v20+ recommended)
- **npm:** v9+
- A Google Cloud / Firebase project with **Firestore** and **Firebase Authentication** enabled.
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

## Setup Guide

### 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or select an existing one.
3. Under **Authentication** -> **Sign-in method**:
   - Enable **Anonymous** provider.
   - Enable **Email/Password** provider.
4. Under **Firestore Database**:
   - Create a Firestore database (production or test mode).
   - Deploy security rules using `firestore.rules`:
     ```bash
     firebase deploy --only firestore:rules
     ```
5. Obtain Frontend Configuration:
   - Go to **Project Settings** -> **General** -> **Your apps** -> Web App (`</>`).
   - Copy the configuration keys into `frontend/.env`.
6. Obtain Backend Service Account:
   - Go to **Project Settings** -> **Service accounts**.
   - Click **Generate new private key** and download the JSON.
   - Extract `project_id`, `client_email`, and `private_key` into `backend/.env`.

### 2. Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a new key.
3. Copy the key into `backend/.env` under `GEMINI_API_KEY`.

---

## Environment Variables

### Frontend (`frontend/.env`)
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

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=8080
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Running Locally

### Backend
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server runs on `http://localhost:3000`.

---

## Running Tests & Linting

### Backend
```bash
cd backend
npm test          # Run Vitest test suite
npm run lint      # Run ESLint
npm run build     # Compile TypeScript
```

### Frontend
```bash
cd frontend
npm test          # Run Vitest test suite
npm run lint      # Run ESLint
npm run build     # Run TypeScript check and Vite build
```

---

## Phase 2: Crisis Safety, History, & Summaries

### Testing Crisis Detection Locally
The crisis detection engine runs two safety layers on every incoming user message:
1. **Deterministic Regex Pattern Matching** (`backend/src/safety/crisis-detector.ts`)
2. **Strict Gemini Risk Classification** (`backend/src/safety/gemini-classifier.ts`)

You can run the dedicated safety test suite locally:
```bash
cd backend
npm test src/safety/safety.test.ts
```

Test examples:
- **Crisis Language:** `"I want to kill myself"`, `"urge to cut myself"`, `"swallowed a bottle of painkillers"` trigger fixed emergency responses with 988 Lifeline resources.
- **Benign Language:** `"My feet are killing me"`, `"I died laughing"`, `"I feel stressed"` are not falsely flagged and proceed to normal empathetic conversation.

### Running Firebase Local Emulator Suite
To run the Firestore emulator locally for testing security rules and offline development:
```bash
# 1. Install Firebase CLI globally or run with npx
npm install -g firebase-tools

# 2. Start the Firestore emulator
firebase emulators:start --only firestore
```
The Firestore emulator will listen on `127.0.0.1:8080` (or the configured port).

### Running Firestore Security Rules Unit Tests
Once the emulator is running, execute the security rules test suite:
```bash
cd backend
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test src/safety/firestore.rules.test.ts
```
The suite verifies that:
- Users can read/write their own profile doc.
- Users can access only their own sessions, messages, and session summaries.
- Cross-user data access is rejected with permission denied.
- Unauthenticated access is rejected.

### Configuring Gemini Safety Settings
In `backend/.env`, configure your Gemini model:
```env
GEMINI_MODEL=gemini-2.5-flash
```
Gemini requests enforce strict JSON validation for safety classification and session summarization. If the Gemini classifier returns malformed JSON or encounters an error, the system automatically falls back to deterministic regex safety checks to ensure user safety is never compromised.

---

## Deployment Notes

- **Backend:** Can be deployed to Google Cloud Run, Heroku, or any Node.js container host. Pass environment variables through your host's secret manager.
- **Frontend:** Can be deployed to Firebase Hosting, Vercel, or Netlify:
  ```bash
  cd frontend
  npm run build
  firebase deploy --only hosting
  ```

---

## Documentation
- [Phase 1 Specification & Architecture](docs/phase-1.md)
- [Phase 2 Specification & Architecture](docs/phase-2.md)
- [Design Tokens & UI System](docs/DESIGN.md)
