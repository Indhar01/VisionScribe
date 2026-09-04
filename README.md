# VisionScribe — AI-Powered Industrial Optical Inspection Journal & Non-Conformance Management

VisionScribe is an enterprise-grade optical non-destructive evaluation (NDE) journal and diagnostics platform designed for certified quality assurance engineers, field maintenance crews, and reliability managers. Conforming to **ISO 9001:2015** and **AS9100 Rev D** standards, VisionScribe transforms optical defect telemetry into structured, auditable Non-Conformance Reports (NCRs), complete with root-cause hypotheses, severity ratings, corrective actions, and 1-click maintenance dispatch tickets.

---

## 🌟 Key Features

- **Automated ISO 9001 / AS9100 NCR Generation**:
  - Analyzes optical defect telemetry alongside inspector field notes to produce structured Non-Conformance Reports.
  - Generates comprehensive engineering evaluations: defect classification, root cause analysis, containment protocols, disposition recommendations, and preventive QA measures.

- **Defect Severity Scoring & Dispositions**:
  - 5-Tier severity evaluation scale:
    - `1 - Negligible Cosmetic Flaw`
    - `2 - Minor Operational Wear`
    - `3 - Moderate Degraded Performance`
    - `4 - Critical Functional Risk`
    - `5 - Immediate Catastrophic Hazard`
  - Automated disposition recommendation: `Use As-Is`, `Rework`, `Repair`, or `Scrap`.

- **1-Click Maintenance Work Order Dispatch**:
  - Automatically synthesizes a formal maintenance dispatch ticket with a unique tracking identifier (e.g., `WO-7842`).
  - Context-aware crew assignment (e.g., *Thermal & Hot-Gas Section Specialist Team*, *Rotating Machinery & Vibration Diagnostic Crew*).
  - Calculates lead-time SLAs ranging from `< 1 Hour Emergency LOTO` to scheduled preventative intervals.
  - Syncs the inspection record status to **`Dispatched`** across the Recent Logs ribbon and journal archive.

- **Flexible NCR Export**:
  - **1-Click Copy**: Copies formatted AS9100 plain text directly to the system clipboard.
  - **Download Report (`.txt`)**: Exports an official plain-text document for paper filing and physical maintenance logs.
  - **Download Telemetry (`.json`)**: Exports machine-readable structured JSON for integration with ERP/MES systems (SAP PM, Maximo, Oracle Maintenance Cloud).
  - **Print Ready**: Styled print stylesheet for immediate hardcopy generation.

- **Multi-Turn Metallurgical & NDT Consultation**:
  - Embedded interactive engineering assistant with full inspection context.
  - Provides guidance on Liquid Penetrant (PT), Magnetic Particle (MT), Phased Array Ultrasonic (PAUT), Eddy Current (ET), and Radiography (RT) verification protocols.

- **Resilient Multi-Model Fallback Ladder**:
  - Server-side Gemini vision pipeline with an automated fallback ladder ordered by availability, low latency, and cluster independence:
    1. `gemini-3.1-flash-lite` (Primary: ~2.5s latency, high capacity)
    2. `gemini-3.8-flash` (Secondary: deep reasoning)
    3. `gemini-3.6-flash` (Tertiary: general flash alternative)
    4. `gemini-flash-latest` (Quaternary: dynamic alias)
  - Automatically intercepts recoverable HTTP status codes (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `404 NOT_FOUND`, `500 INTERNAL`) and transitions seamlessly to the next model.

- **Security & Data Isolation**:
  - Zero client-side API key exposure; all Gemini model queries execute through authenticated backend proxy endpoints (`/api/inspect`, `/api/chat`).
  - Owner-isolated Cloud Firestore persistence under `/users/{userId}/inspections/{id}` enforced by Firestore security rules (`request.auth.uid == userId`).
  - Strict payload sanitization stripping `undefined` fields before database operations.
  - Federated Google Authentication via Firebase Auth.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **Backend**: Node.js, Express, `@google/genai` TypeScript SDK, `tsx`, `esbuild`
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication
- **AI / LLM Engine**: Google Gemini Multimodal Vision API (`@google/genai`)
- **Build System**: Vite 6, `esbuild` bundled CommonJS server (`dist/server.cjs`)
- **Hosting Target**: Google Cloud Run (Containerized SPA + Node.js API)

---

## 📁 Repository Structure

```
.
├── server.ts                       # Express backend API, Gemini model ladder, image sanitization
├── src/
│   ├── App.tsx                     # Main application layout, view state, dispatch handlers
│   ├── components/
│   │   ├── Header.tsx              # Application header & user auth controls
│   │   ├── InspectionForm.tsx      # Optical telemetry upload & defect field entry
│   │   ├── NCRView.tsx             # Non-Conformance Report, Work Order ticket, export menu
│   │   ├── InspectionChat.tsx      # Interactive NDT & metallurgical consultation
│   │   ├── InspectionHistory.tsx   # Searchable, filterable historical inspection journal
│   │   ├── RecentLogsRibbon.tsx    # Live horizontal ticker with dispatch badges
│   │   ├── LoginLanding.tsx        # Authentication gate and security banner
│   │   └── Sidebar.tsx             # Navigation drawer
│   ├── data/
│   │   └── sampleDefects.ts        # Pre-configured industrial defect presets
│   ├── firebase/
│   │   └── config.ts               # Firebase client initialization
│   ├── services/
│   │   └── inspectionService.ts    # Firestore CRUD operations and subscription listeners
│   ├── types/
│   │   └── inspection.ts           # TypeScript interfaces for NCR, WorkOrder, ChatMessage
│   └── utils/
│       ├── imageRasterizer.ts      # Canvas-based rasterizer for SVG/vector image conversion
│       └── sanitize.ts             # Firestore undefined payload sanitizer
├── firestore.rules                 # Cloud Firestore owner-isolated security rules
├── metadata.json                   # AI Studio platform configuration & permissions
├── package.json                    # Project dependencies & build scripts
└── vite.config.ts                  # Vite build configuration with Tailwind CSS plugin
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or later
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)
- **Firebase Project**: A Firebase project with Firestore and Authentication enabled

### Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Firebase credentials are configured in `src/firebase/config.ts` or via platform configuration.

### Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000` with the Express backend serving API routes and Vite handling the client-side SPA.

3. **Validate TypeScript & Linting**:
   ```bash
   npm run lint
   ```

4. **Compile for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Threat Modeling

VisionScribe implements a structured agentic defense posture addressing the OWASP Top 10 for Web and LLM Applications:

| Threat Zone | Identified Risk Scenario | Countermeasure Implemented |
|---|---|---|
| **Input Surfaces** | Malformed image encodings (e.g., SVG text, corrupted data URIs) or injection in notes. | Client-side HTML5 canvas rasterization, strict MIME whitelist (`image/png`, `image/jpeg`, `image/webp`), and server-side byte validation. |
| **Planning & Reasoning** | Upstream model cluster contention (`503 UNAVAILABLE`) or deprecated model identifiers. | Automated 4-tier model fallback ladder with status-code inspection (`503`, `429`, `404`, `500`) and seamless retry logic. |
| **Tool Execution** | Arbitrary command execution or SSRF via image uploads. | Pure server-side isolation with zero external command execution; API proxy handles all upstream LLM calls. |
| **Memory & State** | Cross-user data leakage or corrupted Firestore document schemas. | Owner-bound document paths (`/users/{userId}/inspections/{id}`) enforced by Firestore rules (`request.auth.uid == userId`) and undefined-stripping sanitizers. |
| **Inter-System Comm** | API key leakage or client-side token exposure. | Pure server-side key isolation (`process.env.GEMINI_API_KEY`) without client exposure. |

---

## ☁️ Google Cloud Run Deployment

VisionScribe is optimized for containerized deployment on Google Cloud Run.

### Deploy Command

```bash
gcloud run deploy visionscribe \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY="your_api_key" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

> **Important**: The `--update-labels=dev-tutorial=cloud-run-ai-challenge` flag is required for deployment verification under the Cloud Run AI Challenge standard.

---

## 📄 License

This project is developed for educational and industrial demonstration purposes. Distributed under the MIT License.
