# 🛠️ Tech Stack - Linux Hardening Assistant

A complete breakdown of all technologies used in this project.

---

## 📋 Overview

**Architecture:** Full-stack web application with SSH-based Linux auditing  
**Deployment:** Localhost-only (development/testing)  
**Languages:** TypeScript, Bash  
**Paradigm:** Client-server with real-time SSH communication  

---

## 🎨 Frontend Stack

### Core Framework
- **React 18** — UI library for building interactive components
- **TypeScript** — Type-safe JavaScript for better developer experience
- **Vite** — Fast build tool and development server

### Styling
- **Tailwind CSS** — Utility-first CSS framework for rapid UI development
- **PostCSS** — CSS processing tool
- **Autoprefixer** — Automatic vendor prefixes

### State Management
- **React Hooks** — useState, useEffect, useRef for component state
- **Context API** — Not used (keeping it simple with props)

### HTTP Client
- **Axios** — Promise-based HTTP client for API calls
- Cookie-based session management

### Charts & Visualization
- **Chart.js** — Canvas-based charting library
- **react-chartjs-2** — React wrapper for Chart.js
- Used for: Security score trend visualization

### Icons
- **Lucide React** — Modern, clean icon library
- Examples: Shield, Server, AlertTriangle, CheckCircle

### Data Validation
- **Client-side validation** — Form validation in React components

---

## ⚙️ Backend Stack

### Runtime & Framework
- **Node.js 20+** — JavaScript runtime
- **Express.js** — Minimal web application framework
- **TypeScript** — Type-safe backend development

### SSH Communication
- **ssh2** — Pure JavaScript SSH2 protocol implementation
- Used for: Connecting to Linux servers, executing audit commands
- Features: Authentication, command execution, session management

### AI / Machine Learning
- **Google Generative AI SDK** (`@google/generative-ai`)
  - Model: `gemini-1.5-flash`
  - Purpose: Security analysis, finding prioritization, recommendations
- **Fallback:** Local rule-based analysis (no AI required)

### PDF Generation
- **PDFKit** — PDF document generation library
- Features: Text, tables, formatting, custom styling
- Used for: Audit report exports

### Logging
- **Winston** — Professional logging library
- Log levels: error, warn, info, debug
- Outputs: Console (colorized), file (optional)

### Environment Configuration
- **dotenv** — Load environment variables from .env file
- Variables: PORT, GEMINI_API_KEY, SSH_TIMEOUT, etc.

### Data Validation
- **Zod** — TypeScript-first schema validation
- Used for: Request body validation, type inference

### Session Management
- **cookie-parser** — Parse cookies from requests
- **In-memory session store** — Custom implementation for SSH sessions
- No database required (stateless after disconnect)

### CORS & Security
- **cors** — Cross-Origin Resource Sharing middleware
- Configured for: localhost:3002 (frontend)

---

## 🐳 DevOps & Infrastructure

### Containerization
- **Docker** — Container platform
- **Docker Compose** — Multi-container orchestration
- Used for: Test target (vulnerable Ubuntu container)

### Test Environment
- **Ubuntu 22.04 LTS** (Docker image)
- **OpenSSH Server** — SSH access
- **MySQL 8.0** — Database (for vulnerability testing)
- **Redis 6.0** — Cache server (for vulnerability testing)

---

## 🗄️ Data Storage

### File-Based Storage
- **JSON files** — Audit history persistence
- Location: `data/history.json`
- No database required (keeps it simple)

### Generated Files
- **Fix scripts** — Bash scripts (`.sh`)
- **PDF reports** — Generated on-demand
- Location: `backend/reports/`

### Session Storage
- **In-memory** — Active SSH sessions
- **Cookie-based** — Session ID tracking
- Cleared on disconnect or server restart

---

## 📚 Development Tools

### Build Tools
- **TypeScript Compiler** (`tsc`) — Type checking and compilation
- **Vite** — Frontend bundling and dev server
- **tsx** — TypeScript execution for Node.js
- **ts-node-dev** — Development server with auto-reload

### Code Quality
- **ESLint** — JavaScript/TypeScript linting
- **Prettier** (not configured) — Code formatting
- **TypeScript** — Static type checking

### Package Managers
- **npm** — Node package manager
- Workspace-aware (monorepo-style setup)

---

## 🔧 Configuration Files

### Frontend
- `vite.config.ts` — Vite configuration (port 3002, proxy to backend)
- `tailwind.config.js` — Tailwind CSS customization
- `postcss.config.js` — PostCSS plugins
- `tsconfig.json` — TypeScript configuration
- `package.json` — Dependencies and scripts

### Backend
- `tsconfig.json` — TypeScript configuration
- `package.json` — Dependencies and scripts
- `.env` — Environment variables (gitignored)
- `.env.example` — Environment variable template

### Docker
- `docker-compose.yml` — Multi-container setup
- `Dockerfile` — Ubuntu test target image
- `.dockerignore` — Build optimization

### Root
- `.gitignore` — Git exclusions
- `README.md` — Project documentation
- `package.json` — Root workspace scripts

---

## 📦 Key Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "axios": "^1.7.9",
  "chart.js": "^4.4.7",
  "react-chartjs-2": "^5.3.0",
  "lucide-react": "^0.469.0",
  "tailwindcss": "^3.4.1"
}
```

### Backend Dependencies
```json
{
  "express": "^4.21.2",
  "@google/generative-ai": "^0.21.0",
  "ssh2": "^1.16.0",
  "pdfkit": "^0.15.1",
  "winston": "^3.17.0",
  "zod": "^3.24.1",
  "dotenv": "^16.4.7",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5"
}
```

### Dev Dependencies
```json
{
  "typescript": "^5.x",
  "vite": "^6.x",
  "@types/node": "^22.x",
  "@types/react": "^18.x",
  "@types/express": "^5.x",
  "tsx": "^4.x",
  "ts-node-dev": "^2.x"
}
```

---

## 🏗️ Architecture Patterns

### Frontend Architecture
- **Component-based** — Modular React components
- **Functional components** — Hooks over class components
- **Props drilling** — Simple state passing (no context needed)
- **API layer separation** — `api/` directory with typed endpoints

### Backend Architecture
- **MVC-inspired** — Controllers, Services, Utilities
- **Middleware chain** — Request logging, error handling, CORS
- **Factory pattern** — Gemini vs Local analysis selection
- **Session management** — Custom in-memory store

### Project Structure
```
linux-hardening-assistant/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── api/          # API client & endpoints
│   │   ├── components/   # React components
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── backend/              # Express + TypeScript
│   ├── src/
│   │   ├── ai/           # Gemini AI service
│   │   ├── auditors/     # Analysis engines
│   │   ├── config/       # Environment & logging
│   │   ├── controllers/  # Route handlers
│   │   ├── demo/         # Demo data
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── ssh/          # SSH client
│   │   └── utils/        # Helpers & validators
│   └── reports/          # Generated files
├── docker/               # Docker test environment
│   └── test-target/      # Vulnerable Ubuntu container
└── data/                 # JSON storage
```

---

## 🔒 Security Considerations

### Authentication
- **SSH password-based** — Passwords stored in memory only
- **No credential persistence** — Cleared on disconnect
- **Cookie-based sessions** — HttpOnly cookies for session IDs

### Network Security
- **Localhost-only** — Not exposed to internet
- **CORS restricted** — Only allows localhost:3002
- **Private IPs allowed** — 192.168.x.x, 10.x.x.x, 172.16-31.x.x

### Code Security
- **Input validation** — Zod schemas for all API inputs
- **Error sanitization** — No stack traces in production
- **Read-only audits** — No system modifications during audit
- **Fix script review** — User confirmation before execution

---

## 🌐 API Design

### RESTful Endpoints
```
POST /api/connect       — SSH connection
POST /api/audit         — Run 16 security checks
POST /api/analyze       — AI/local analysis
POST /api/demo          — Load demo data
POST /api/chat          — Chat with audit results
POST /api/disconnect    — End SSH session
POST /api/fix-script    — Generate fix script
GET  /api/fix-script/download — Download fix script
GET  /api/export-pdf    — Download PDF report
GET  /api/reports       — Audit history
GET  /api/version       — Version + Gemini status
GET  /api/health        — Health check
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": "message" // only on failure
}
```

---

## 📊 Performance Optimizations

### Frontend
- **Vite HMR** — Hot module replacement for fast development
- **Code splitting** — Automatic chunking by Vite
- **Asset optimization** — Minification in production build
- **Tailwind purging** — Removes unused CSS classes

### Backend
- **In-memory sessions** — Fast session lookups
- **Streaming responses** — PDF generation streamed to client
- **Connection pooling** — SSH connections reused per session
- **Lazy loading** — Gemini service only initialized when needed

### Docker
- **Multi-stage builds** — Optimized image size
- **Layer caching** — Faster rebuilds
- **Health checks** — Container health monitoring

---

## 🧪 Testing Strategy

### Current State
- **Manual testing** — UI and API tested manually
- **Demo mode** — Reproducible test data
- **Docker environment** — Isolated test target

### Testing Opportunities (Not Implemented)
- Unit tests (Jest, Vitest)
- Integration tests (Supertest)
- E2E tests (Playwright, Cypress)
- SSH mock tests

---

## 📈 Scalability Considerations

### Current Design
- **Single-server** — Localhost only
- **In-memory state** — Sessions not persisted
- **File-based storage** — JSON history

### Production Considerations (Future)
- Database: PostgreSQL, MongoDB
- Session store: Redis
- Queue system: Bull, RabbitMQ
- Containerization: Full Docker deployment
- Reverse proxy: Nginx
- Process manager: PM2

---

## 🎓 Learning Resources

### Frontend
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Backend
- [Express.js Docs](https://expressjs.com)
- [ssh2 Documentation](https://github.com/mscdex/ssh2)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Zod Documentation](https://zod.dev)

### Docker
- [Docker Docs](https://docs.docker.com)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## 📝 Summary

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | UI framework |
| **Styling** | Tailwind CSS | Responsive design |
| **Backend** | Express + TypeScript | API server |
| **SSH** | ssh2 | Linux connection |
| **AI** | Gemini 1.5 Flash | Security analysis |
| **PDF** | PDFKit | Report generation |
| **Charts** | Chart.js | Trend visualization |
| **Validation** | Zod | Type-safe validation |
| **Logging** | Winston | Professional logging |
| **Container** | Docker + Docker Compose | Test environment |
| **Storage** | JSON files | Audit history |

---

**Total Technologies:** 20+  
**Lines of Code:** ~10,000+ (estimated)  
**Components:** 15+ React components  
**API Endpoints:** 12  
**Audit Checks:** 16  

---

This is a **modern, full-stack TypeScript application** with AI integration and SSH automation! 🚀
