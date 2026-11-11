# Privacy, Safety & Ethical Guidelines

## 1. Product Boundaries & Honest Identity
The **AI Wellness Companion** is an automated conversational tool created to assist users with self-reflection, emotional decompression, and evidence-informed coping exercises (e.g. 4-7-8 breathing, 5-4-3-2-1 sensory grounding).

**What the app IS NOT:**
- It is **not** a licensed therapist, counselor, psychiatrist, or medical doctor.
- It does **not** provide psychological diagnosis, medical treatment, or clinical intervention.
- It is **not** an emergency service, 911 dispatch, or crisis clinic.
- It is **not** a confidential healthcare relationship covered by HIPAA or doctor-patient privilege.

---

## 2. Crisis Response Policy
Whenever a user indicates intent or thoughts of self-harm, suicide, overdose, domestic abuse, or violence toward others:
1. **Immediate AI Interception:** Normal AI companion generation is immediately bypassed.
2. **Fixed Server-Side Escalation:** Only pre-approved, fixed crisis responses containing verified contact numbers (988 Lifeline, 911, and `findahelpline.com`) are returned.
3. **Never Minimizing or Debating:** The system never debates suicidal thoughts, provides reassurance that minimizes risk, or supplies instructions or methods.
4. **Permanent Visibility of Emergency Help:** The "I need urgent help now" button remains permanently accessible at all times on all devices, independent of server or AI connectivity.

---

## 3. Data Privacy & Minimization
- **Anonymous Guest Access:** Users can use the companion without providing an email address or personal identity.
- **Minimal Metadata Logging:** Raw user messages, crisis disclosures, and trauma narratives are **never** logged to stdout, logs, or third-party monitoring systems. Only non-sensitive operational metadata (e.g., `sessionId`, `riskLevel: 'crisis'`, `shownCrisisResources: true`) is recorded for uptime tracking.
- **User Ownership & Cascade Deletion:** Users retain full control of their conversation history. Deleting a conversation permanently purges the session document, all associated messages, and session summaries from Firestore.

---

## 4. Emergency Resource Directory

| Resource | Contact Details | Purpose | Coverage |
| :--- | :--- | :--- | :--- |
| **988 Suicide & Crisis Lifeline** | Call or Text `988`<br>Web: [988lifeline.org](https://988lifeline.org) | 24/7 free, confidential crisis counseling | United States & Canada |
| **The Trevor Project** | Call `1-866-488-7386`<br>Text `START` to `678-678` | 24/7 suicide prevention for LGBTQ youth | United States |
| **Veterans Crisis Line** | Call `988` (Press 1)<br>Text `838255` | 24/7 support for veterans and service members | United States |
| **Crisis Text Line** | Text `HOME` to `741741` | Free 24/7 crisis text support | U.S., UK, Canada |
| **Local Emergency Dispatch** | Call `911` | Immediate physical danger, severe injury, violence | United States |
| **International Resources** | Web: [findahelpline.com](https://findahelpline.com) | Free, confidential global directory | Worldwide |
