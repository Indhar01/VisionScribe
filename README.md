# VisionScribe: AS9100 Aerospace Inspection & Discrepancy Journal

> **Enterprise AI Quality Management for Airbus, Rolls-Royce, and Bombardier**  
> Built for the **Google Cloud Run AI Challenge** (`#AccelerateAIwithCloudRun`).

---

## ✈️ Executive Overview

**VisionScribe** is an enterprise-grade, user-authenticated inspection journaling and Non-Conformance Report (NCR) platform engineered for flight quality engineers and NDT inspectors across commercial aerospace manufacturing lines (Airbus A350, Rolls-Royce Trent XWB, Bombardier Global 7500).

Inspectors write multi-turn observation logs, pin coordinates on interactive airframe schematics, and converse with **Gemini 3.6 Flash** for instant root cause FMEA analysis, 8D containment protocols, and Material Review Board (MRB) dispositions. All data is cryptographically audited and isolated strictly to authenticated users in **Cloud Firestore**.

---

## 🏛️ System Architecture & Tech Stack

```
 ┌────────────────────────────────────────────────────────────┐
 │                  Client Browser (Vite + React)             │
 │   - Firebase Authentication (Google Identity / Federated)  │
 │   - Interactive SVG Airframe Blueprint Visualizer          │
 │   - Multi-Turn Copilot Chat & 8D NCR Export Interface      │
 └────────────────────────────┬───────────────────────────────┘
                              │
                      HTTPS / JSON Proxy
                              │
 ┌────────────────────────────▼───────────────────────────────┐
 │            Express Server on Google Cloud Run              │
 │   - Top-Level Sanitization & Zero-Hardcoded Secret Mgmt    │
 │   - Gemini Resilient Fallback Ladder (3.6 -> 3.1 -> Flash) │
 └─────────────┬──────────────────────────────┬───────────────┘
               │                              │
 ┌─────────────▼──────────────┐ ┌─────────────▼───────────────┐
 │   Google Secret Manager    │ │    Google Gemini 3.6 Flash  │
 │  (IAM Secret Accessor)     │ │   (@google/genai Node SDK)  │
 └────────────────────────────┘ └─────────────────────────────┘
               │
 ┌─────────────▼──────────────────────────────────────────────┐
 │                  Cloud Firestore                           │
 │   - Strict User Data Isolation: /users/{userId}/*          │
 │   - Immutable SHA-256 Audit Trail: /users/{userId}/auditLogs│
 └────────────────────────────────────────────────────────────┘
```

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18 + TypeScript + Vite | Interactive HUD interface with Tailwind CSS styling |
| **User Identity** | Firebase Authentication | Federated Google Identity (zero password storage) |
| **Database Persistence** | Cloud Firestore | Owner-bound user data isolation (`/users/{uid}/*`) |
| **AI Reasoning Engine**| Gemini 3.6 Flash | Multi-turn FMEA risk scoring, 8D containment, and NCRs |
| **Backend & Ingress** | Express + Node.js on Cloud Run | API proxy, payload hygiene, model fallback ladder |
| **Secret Management** | Google Cloud Secret Manager | Dynamic injection of `GEMINI_API_KEY` |

---

## 🔒 1. Firestore Security Rules

Deploy these rules to ensure absolute data isolation between aerospace inspectors:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Authenticated user helper
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Strict Owner-Bound Data Isolation
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Isolated Inspections Subcollection
    match /users/{userId}/inspections/{inspectionId} {
      allow read, write: if isOwner(userId);
    }

    // Multi-Turn Chat Interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if isOwner(userId);
    }

    // Cryptographic Compliance & Audit Logs
    match /users/{userId}/auditLogs/{auditId} {
      allow read, write: if isOwner(userId);
    }
    
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔑 2. Secret Manager Configuration

Store the Gemini API credentials dynamically without hardcoding:

```bash
# 1. Enable required Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Cloud Run Service Account read permissions
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 3. Cloud Run Deployment Flow

Build and deploy the full-stack container to Google Cloud Run:

```bash
# Build and deploy container directly to Cloud Run
gcloud run deploy visionscribe \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 🏷️ 4. Campaign Verification Label (Required)

Apply the mandatory challenge label to register your deployment for verification:

```bash
gcloud run services update visionscribe \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 5. End-to-End Walkthrough & Test Guide

### Scenario 1: Authentication & User Data Isolation
1. Launch the web app and land on the **Aerospace Inspector Sign In** screen.
2. Sign in using **Google Identity** or select **Fast-Track AS9100 Quality Lead (Airbus A350)**.
3. Verify that the private dashboard renders exclusively records associated with your authenticated UID.

### Scenario 2: Multi-Turn Inspection Entry & AI Reflection
1. Under **New Inspection Log**, choose **Airbus A350** or **Rolls-Royce Trent XWB**.
2. Click on the interactive SVG airframe schematic to pin coordinate hotspots (e.g., `(38%, 44%) - Port Wing Center Spar`).
3. Enter discrepancy observations or click the quick preset **A350** / **Trent XWB**.
4. Click **Generate Gemini 3.6 AS9100 Reflection**.
5. Observe the instant FMEA RPN score, Root Cause hypothesis (8D D4), and Material Review Board disposition.
6. Click **Save Inspection Entry** to commit the record to Cloud Firestore with celebratory feedback.

### Scenario 3: Multi-Turn Engineering Dialogue
1. Navigate to the **Gemini Copilot Chat** tab.
2. Ask questions such as *"Draft an engineering concession proposal for Material Review Board (MRB) approval."*
3. Verify multi-turn conversational memory persisted to `/users/{userId}/interactions/*`.

### Scenario 4: 8D Non-Conformance Report (NCR) & MRB Sign-off
1. Navigate to **8D NCR Reports**.
2. Click **Generate 8D NCR via Gemini 3.6 Flash** to synthesize D1 through D8 disciplines.
3. Click **Execute MRB Sign-Off** to authorize the report with formal timestamp and auditor credentials.
4. Click **Print / PDF** to generate an official printable compliance document.

### Scenario 5: Cryptographic Audit Trail Verification
1. Open the **Audit & Compliance** tab.
2. Verify tamper-evident SHA-256 event checksums for every create, update, and sign-off action.
3. Click **Export Audit Log (JSON)** to download the AS9100 regulatory package.

---

## 📢 6. Social Media & Hackathon Submission Copy

> **Post on LinkedIn / X (#AccelerateAIwithCloudRun #GoogleCloud #GeminiAI):**
>
> 🚀 Excited to unveil **VisionScribe**, an AI-powered aerospace inspection and discrepancy intelligence platform built for the **Google Cloud Run AI Challenge**! ✈️
>
> Engineered for manufacturing quality leads at Airbus, Rolls-Royce, and Bombardier, VisionScribe integrates:
> 🔹 **Gemini 3.6 Flash** for real-time FMEA risk scoring, root cause analysis, and AS9100 8D NCR generation
> 🔹 **Cloud Firestore** for owner-bound, zero-trust user data isolation
> 🔹 **Google Cloud Run & Secret Manager** for serverless container deployment and zero-hardcoded secret security
> 🔹 **Interactive SVG Blueprint Pinning** & cryptographic SHA-256 audit trails
>
> Check out the live demo and architecture on Google Cloud Run! #AccelerateAIwithCloudRun #GoogleAIStudio #AerospaceQuality #CloudRun
