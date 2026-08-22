# 🎓 UniCollab — Next-Gen Academic Collaboration & Mentorship Platform
> **Designed & Architected by Code Morphicx**  
> **Live Production URL:** [https://unicollab1.onrender.com](https://unicollab1.onrender.com)

---

## 🌟 Executive Summary
**UniCollab** is a full-stack, real-time academic collaboration ecosystem engineered to connect university students, researchers, and verified industry mentors across multidisciplinary fields. It bridges the gap between academic theory and real-world project execution through team formation, mentor booking, Kanban workspaces, hackathons, and AI-powered team matchmaking.

---

## 🚀 Key Features & Modules

### 1. 🔐 Dual-Role Authentication & Security
- **Student & Mentor Onboarding:** Tailored registration flows with dynamic department/branch resolution (ECE, CSE, AI & DS, IT, Mechanical, Civil, Biotech, etc.).
- **Security & Integrity:** Passwords encrypted using `bcryptjs` (salt rounds: 10) with JSON Web Tokens (JWT) for stateless session authentication.
- **OTP Password Recovery:** Secure 6-digit email OTP verification for password resets.
- **Duplicate Email Protection:** Real-time database conflict validation preventing duplicate registrations.

### 2. 🤝 Intelligent Teammates Discovery
- **Self-Excluding Candidate Directory:** Automatically hides the logged-in student's card while showcasing all active peers across campuses.
- **Cross-Discipline Filters:** Instant filtering by branch, degree program, and specialized tech stack.
- **Instant Collaboration Requests:** Send direct collaboration invitations with live status tracking.

### 3. 🚀 Project Incubator & Applications
- **Project Directory:** Browse, filter, and launch student-led initiatives across Web Development, AI/ML, Cloud Infrastructure, and IoT.
- **Application Pipeline:** One-click team applications with role selection and portfolio submission.

### 4. 👨‍🏫 Verified Mentor Network & Scheduling
- **Expert Advisory:** Browse mentors from faculty and leading tech companies.
- **Session Scheduling:** Real-time booking system for project reviews, architecture guidance, and resume critiques.

### 5. ⚡ Team Kanban Workspace
- **Interactive Task Boards:** Drag-and-drop task lifecycle management (*To Do*, *In Progress*, *Review*, *Completed*).
- **Team Synchronized Updates:** Real-time task assignment and progress metrics.

### 6. 🤖 Global AI Assistant & Smart Matchmaker
- **Context-Aware Team Matching:** Matches complementary skills and project focus automatically.
- **AI Code Review & Architecture Guidance:** Instant architectural recommendations and clean coding analysis.

### 7. 🏆 Hackathon Hub & Live Countdowns
- **Competitions Directory:** Register solo or with existing teams for university hackathons.
- **Interactive Modals:** Real-time registration and participant roster management.

### 8. 💬 Real-Time WebSockets Messaging Engine
- **Socket.io Integration:** Zero-latency direct messaging between team members, applicants, and mentors.

### 9. 🛡️ Executive Master Admin Control Panel
- **Separate Student & Mentor Directories:** Dedicated control panels with role-specific column layouts and instant switching.
- **Registration Timestamp Tracking:** High-precision datetime sorting (newest registrations first) with activity badges.
- **Database Export:** One-click CSV export of platform users.

---

## 🏗️ Technical Architecture & Stack

| Layer | Technology Stack |
|---|---|
| **Frontend UI / SPA** | React 19, Vite 8, Lucide Icons, Pure Responsive CSS3 Modules |
| **Theme Engine** | Dynamic Light & Dark Mode with Persistent Local Storage State |
| **Backend Server** | Node.js (ES Modules), Express 5, Socket.io 4 (WebSockets) |
| **Database & ORM** | PostgreSQL on Supabase Cloud, Prisma ORM 5.22.0 |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs`, RESTful Bearer Token Middleware |
| **Deployment & CI/CD** | Render Cloud Platform (Unified Static SPA + Node API Service) |

---

## 📋 Internship Demo Presentation Walkthrough

Follow this curated sequence for an impactful live demonstration:

1. **Platform Landing Page (`/`):**
   - Showcase the modern landing interface, stats counters, interactive feature cards, and dark/light mode toggle.
2. **Dual-Role Registration (`/#login`):**
   - Demonstrate signing up as a student (e.g. `Electronics & Communication (ECE)`).
   - Point out that it redirects to Sign In with a green success message instead of jumping directly.
   - Test duplicate email validation by trying to re-register with the same email.
3. **Dashboard & Top Bar (`/#dashboard`):**
   - Highlight the dynamic personalized greeting and header badge reflecting the exact branch and university.
4. **Find Teammates Discovery (`/#find-teammates`):**
   - Show how the current user's profile card is hidden, while all other registered students are filterable by department and skills.
5. **Team Workspace & Projects (`/#workspace` & `/#projects`):**
   - Demonstrate creating a project and interacting with the Kanban task board.
6. **Mentor Portal (`/#mentor-portal`):**
   - Showcase mentor booking scheduling with instant session confirmation.
7. **AI Assistant (`/#ai-assistant`):**
   - Demonstrate AI teammate matching queries and code optimization tips.
8. **Master Admin Portal (`/#admin` — Passkey: `admin123`):**
   - Demonstrate the separate **🎓 Students** and **👨‍🏫 Mentors** tabs.
   - Highlight real-time registration timestamps and CSV data export.

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/gaganr123456789-ctrl/unicollab1.git
cd unicollab1

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Start Unified Development Server
npm start
# Server starts on http://localhost:5000 (Serving static frontend + API)
```

---

## 🌐 Live Deployment
- **Main Web Application:** [https://unicollab1.onrender.com](https://unicollab1.onrender.com)
- **Master Admin Portal:** [https://unicollab1.onrender.com/#admin](https://unicollab1.onrender.com/#admin)
