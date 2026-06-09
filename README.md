# Linux Hardening Assistant

> A modern web application for automated Linux security auditing and hardening with AI-powered recommendations. v2.0

An AI-powered, locally-hosted web application that connects to Linux systems via SSH, performs automated security audits across 16 check categories, generates a scored report, and produces a downloadable remediation script.

Works fully offline — no public internet required. Gemini AI is optional.

---

## 🚀 Quick Start (5 Minutes)

> 📖 **New to Docker?** Read the [Docker Quick Start Guide](DOCKER_GUIDE.md) for detailed step-by-step instructions.

### Option 1: Docker Test Environment (Easiest)

1. **Start the test target:**
   ```cmd
   docker-compose up -d
   ```
   Or double-click: `start-docker-target.cmd`

2. **Start the backend (new terminal):**
   ```cmd
   cd backend
   npm install
   npm run dev
   ```

3. **Start the frontend (new terminal):**
   ```cmd
   cd frontend
   npm install
   npm run dev
   ```

4. **Open http://localhost:3002**

5. **Connect to the test target:**
   - Host: `localhost`
   - Port: `2222`
   - Username: `testuser`
   - Password: `testpass123`

6. **Click "Run Audit" → See your first security report!**

### Option 2: Demo Mode (No Setup)

1. Start backend and frontend (steps 2-3 above)
2. Open http://localhost:3002
3. Click "Demo Mode" → Instant results!

---

## Features

| Feature | Details |
|---|---|
| SSH Audit | Connects to Ubuntu WSL, VirtualBox VMs, VMware VMs, LAN Linux hosts |
| 16 Audit Checks | SSH config, firewall, Fail2Ban, Auditd, open ports, file permissions, password policy, updates, and more |
| Security Score | 0–100 with grade (Excellent / Good / Moderate / Poor / Critical) |
| Score Breakdown | Per-severity deductions shown in the UI |
| Gemini AI Mode | Full 5-step AI workflow: collect → analyze → fixes → verify → report |
| Local Analysis Mode | Rule-based analysis — no API key needed, never fails |
| Fix Script | Downloadable `fix.sh` with confirmation prompt and inline comments |
| PDF Export | Full PDF report with score, findings, fix script, and compliance notes |
| Demo Mode | No SSH or API key required — loads realistic Ubuntu 22.04 sample data |
| Audit History | Persistent JSON history with security trend chart |
| AI Chat | Ask questions about your audit results (requires Gemini key) |
| Dark Mode | System-aware, persisted across sessions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| SSH | ssh2 |
| AI | @google/generative-ai (Gemini) |
| PDF | PDFKit |
| Charts | Chart.js + react-chartjs-2 |
| Validation | Zod |

---

## Project Structure

```
linux-hardening-assistant/
│
├── .env.example              ← Environment variable template
├── .env                      ← Your local config (gitignored)
├── package.json              ← Root workspace scripts
│
├── backend/
│   ├── src/
│   │   ├── index.ts          ← Express app entry point
│   │   ├── config/
│   │   │   ├── env.ts        ← Environment variable loader
│   │   │   └── logger.ts     ← Winston logger
│   │   ├── ssh/
│   │   │   └── sshClient.ts  ← SSH2 client + 16 audit commands
│   │   ├── auditors/
│   │   │   ├── scoreEngine.ts       ← Score calculation
│   │   │   ├── localAnalyzer.ts     ← Rule-based analysis (offline)
│   │   │   └── fixScriptGenerator.ts← fix.sh generator
│   │   ├── ai/
│   │   │   └── geminiService.ts     ← Gemini AI integration + fallback
│   │   ├── demo/
│   │   │   └── demoData.ts          ← Sample audit data
│   │   ├── controllers/             ← Route handlers
│   │   ├── services/                ← History + file storage
│   │   ├── middleware/              ← Error handling, logging
│   │   ├── routes/
│   │   │   └── index.ts             ← API route registry
│   │   └── utils/
│   │       ├── types.ts             ← Shared TypeScript types
│   │       ├── validators.ts        ← Zod input validation
│   │       └── sessionStore.ts      ← In-memory session store
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx          ← React entry point
│   │   ├── App.tsx           ← Root component + state
│   │   ├── index.css         ← Tailwind + custom components
│   │   ├── api/
│   │   │   ├── client.ts     ← Axios client
│   │   │   └── endpoints.ts  ← Typed API calls
│   │   ├── components/       ← All UI components
│   │   └── types/index.ts    ← Frontend TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── reports/                  ← Generated fix scripts
└── data/                     ← Audit history (JSON)
```

---

## Local Installation

### Prerequisites

- Node.js 20+ — https://nodejs.org
- npm 10+
- **Docker Desktop** (for testing with Docker target) — https://www.docker.com/products/docker-desktop

### 1. Clone / Navigate to the Project

```cmd
cd linux-hardening-assistant
```

### 2. Create Environment File

```cmd
copy .env.example .env
```

Edit `.env` and optionally add your `GEMINI_API_KEY`. The app works without it.

### 3. Install Dependencies

```cmd
npm run install:all
```

Or manually:
```cmd
cd backend && npm install
cd ..\frontend && npm install
```

### 4. Start the Backend

```cmd
cd backend
npm run dev
```

The API server starts at **http://localhost:3001**

### 5. Start the Frontend (separate terminal)

```cmd
cd frontend
npm run dev
```

The UI opens at **http://localhost:3002**

---

## Docker Test Environment (Recommended for Testing)

The easiest way to test the Linux Hardening Assistant is with the included Docker test environment. This creates a deliberately vulnerable Ubuntu 22.04 container with SSH enabled.

### Why Use Docker for Testing?

- ✅ No need to set up WSL, VirtualBox, or VMware
- ✅ Isolated test environment (won't affect your system)
- ✅ Pre-configured with intentional security issues
- ✅ One command to start/stop
- ✅ Consistent results across all platforms

### What's Included in the Docker Test Target?

The Docker container has **intentional security misconfigurations** for testing:

| Issue | Description |
|---|---|
| Root SSH login enabled | `PermitRootLogin yes` |
| Password authentication enabled | No key-based auth required |
| No firewall | UFW not installed |
| No Fail2Ban | No intrusion prevention |
| No Auditd | No audit logging |
| MySQL on 0.0.0.0 | Port 3306 exposed to all interfaces |
| Redis on 0.0.0.0 | Port 6379 exposed to all interfaces |
| World-writable files | Files in /etc with 777 permissions |
| Weak /etc/shadow permissions | 644 instead of 640 |
| No password aging | PASS_MAX_DAYS = 99999 |
| Pending updates | Package updates available |

**Expected Security Score:** ~35-45/100 (Critical/Poor grade)

### Quick Start with Docker

1. **Start the Docker test target:**
   ```cmd
   docker-compose up -d
   ```

2. **Wait for the container to be ready (5-10 seconds):**
   ```cmd
   docker logs linux-hardening-test-target
   ```
   
   You should see:
   ```
   ==========================================================
   Starting Vulnerable Ubuntu Test Target
   ==========================================================
   SSH Access:
     Host: localhost
     Port: 2222
     Root: root / testroot123
     User: testuser / testpass123
   ==========================================================
   ```

3. **Connect from the Linux Hardening Assistant UI:**
   - Host: `localhost`
   - Port: `2222`
   - Username: `testuser` (or `root`)
   - Password: `testpass123` (or `testroot123` for root)

4. **Run the audit and see findings!**

5. **Stop the container when done:**
   ```cmd
   docker-compose down
   ```

### Docker Troubleshooting

#### "Port 2222 already in use"
```cmd
# Find what's using the port
netstat -ano | findstr :2222

# Either kill that process or change the port in docker-compose.yml:
# ports:
#   - "2223:22"  # Use 2223 instead
```

#### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running
- On Windows: Check that the Docker Desktop service is started

#### "Connection refused" when connecting via SSH
```cmd
# Check if the container is running
docker ps

# Check container logs for errors
docker logs linux-hardening-test-target

# Restart the container
docker-compose restart
```

#### Test SSH connection manually (Windows):
```cmd
ssh -p 2222 testuser@localhost
# Password: testpass123
```

#### Access the container shell directly:
```cmd
docker exec -it linux-hardening-test-target bash
```

### Rebuild the Docker Image

If you modify the Dockerfile:
```cmd
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## SSH Setup Guide (Alternative to Docker)

### Ubuntu WSL (Windows Subsystem for Linux)

1. Install OpenSSH in WSL:
   ```bash
   sudo apt-get update && sudo apt-get install -y openssh-server
   sudo service ssh start
   ```
2. Find your WSL IP:
   ```bash
   ip addr show eth0 | grep "inet "
   ```
3. In the app: use that IP (usually `172.x.x.x`), port `22`, your WSL username/password.

### VirtualBox Ubuntu Server

1. In VirtualBox settings → Network → Add Host-Only Adapter
2. Check the VM's IP: `ip addr show`
3. Use that IP (usually `192.168.56.x`) in the app.

### VMware Linux VM

1. Use NAT or Host-Only networking
2. Check IP: `ip addr show`
3. Use that IP in the app.

### LAN Linux Machines

Any Linux host on the same local network (10.x.x.x, 192.168.x.x, 172.16–31.x.x) works directly.
Ensure SSH service is running: `sudo systemctl start ssh`

---

## Gemini AI Setup

1. Get a free API key: https://aistudio.google.com/apikey
2. Add to `.env`:
   ```
   GEMINI_API_KEY=AIza...
   ```
3. Restart the backend.

**Without Gemini:** The app automatically uses local rule-based analysis. You'll see a banner in the UI:
> "Local Mode: Gemini API key not configured. Using rule-based analysis."

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/version` | Version + Gemini status |
| `POST` | `/api/connect` | Connect via SSH |
| `POST` | `/api/audit` | Run 16 audit checks |
| `POST` | `/api/analyze` | AI or local analysis |
| `POST` | `/api/demo` | Load demo data |
| `POST` | `/api/disconnect` | End SSH session |
| `GET` | `/api/fix-script/download` | Download fix.sh |
| `POST` | `/api/fix-script` | Generate script from findings |
| `GET` | `/api/export-pdf` | Download PDF report |
| `POST` | `/api/chat` | Chat (requires Gemini) |
| `GET` | `/api/reports` | Audit history |
| `GET` | `/api/reports/:id` | Single report |

### POST /api/connect — Request Body
```json
{
  "host": "192.168.1.100",
  "port": 22,
  "username": "ubuntu",
  "password": "your-password"
}
```

### SSH Error Responses
| Error Type | HTTP | Cause |
|---|---|---|
| `auth_error` | 401 | Invalid username or password |
| `timeout` | 504 | No response within 30 seconds |
| `connection_refused` | 503 | SSH service not running |
| `host_unreachable` | 503 | IP not reachable |

---

## Audit Checks (16 Total)

| Key | Check | Severity if Failed |
|---|---|---|
| `ssh_password_auth` | SSH password authentication | High |
| `ssh_root_login` | SSH root login enabled | High |
| `ssh_service_enabled` | SSH service state | Info |
| `ufw_status` | UFW firewall | Medium |
| `fail2ban_status` | Fail2Ban intrusion prevention | Medium |
| `auditd_status` | Auditd logging | Low |
| `open_ports` | Database/cache on 0.0.0.0 | Critical |
| `running_services` | Unnecessary services | Info |
| `password_policy` | Password aging policy | Low |
| `sudo_users` | Sudo group membership | Info |
| `os_release` | OS version | Info |
| `kernel_info` | Kernel version | Info |
| `pending_updates` | Available updates | Medium |
| `world_writable_files` | World-writable sensitive files | Medium |
| `file_permissions` | /etc/shadow permissions | High |
| `swap_status` | Swap configuration | Info |

---

## Security Score Rules

| Severity | Deduction |
|---|---|
| Critical | -20 per finding |
| High | -10 per finding |
| Medium | -5 per finding |
| Low | -2 per finding |

| Score Range | Grade |
|---|---|
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Moderate |
| 40–59 | Poor |
| 0–39 | Critical |

---

## Troubleshooting

### "Connection refused" on WSL
```bash
sudo service ssh start
# or
sudo systemctl enable --now ssh
```

### "Host unreachable" on VirtualBox
- Check the VM network adapter is set to Host-Only or Bridged (not NAT-only)
- Ping the VM IP from Windows: `ping 192.168.56.101`

### Backend won't start — port already in use
```cmd
# Find what's using port 5000
netstat -ano | findstr :5000
# Kill it or change PORT in .env
```

### Gemini returns errors
- Verify the API key in `.env` is correct
- The model `gemini-2.0-flash` is used by default — no additional setup needed
- The app will fall back to local analysis automatically on API errors

### Frontend can't reach backend
- Ensure the backend is running on port 5000
- Vite dev server proxies `/api` to `http://localhost:5000` automatically

---

## Demo Mode

Click **Demo Mode** in the action panel. No SSH server or Gemini API key required.

Loads:
- Sample Ubuntu 22.04 server audit data
- 8 pre-built findings (Critical, High, Medium, Low)
- Security score with full breakdown
- Downloadable fix.sh and PDF report
- Populates the trend chart and history table

---

## Manual Testing Checklist

### SSH Connection Tests
- [ ] Connect with valid credentials → "Connected" badge appears
- [ ] Connect with wrong password → Error: "Invalid username or password."
- [ ] Connect to unreachable IP → Error: "Target host cannot be reached."
- [ ] Connect to IP with SSH not running → Error: "SSH service is unavailable."
- [ ] Connect and leave idle 30s → Timeout error displayed

### Audit & Analysis Tests
- [ ] Run Audit → 16 checks complete, server info populated
- [ ] Click Analyze → Score appears, findings grouped by severity
- [ ] Analyze without Gemini key → "Local Analysis" mode message shown
- [ ] Analyze with Gemini key → "AI (Gemini)" mode shown in workflow steps

### Demo Mode Tests
- [ ] Click Demo Mode → Score 39/100, 8 findings loaded
- [ ] PDF exports with score and findings
- [ ] fix.sh downloads with confirmation prompt
- [ ] History table updates with demo entry

### PDF Export Tests
- [ ] PDF generates without errors
- [ ] All severity sections present
- [ ] Fix script excerpt included
- [ ] Compliance notes section present

### Fix Script Tests
- [ ] Script starts with `#!/bin/bash`
- [ ] Includes `read -r -p "Apply all fixes? (yes/no):"` confirmation
- [ ] Each fix has an inline comment explaining the risk
- [ ] `set -euo pipefail` is present

### Local Analysis Mode Tests
- [ ] Remove `GEMINI_API_KEY` from `.env`, restart backend
- [ ] Run analysis → "Local Mode" banner shown in UI
- [ ] Findings generated for SSH, firewall, fail2ban issues
- [ ] Score calculated correctly

---

## Security Notes

- SSH passwords are held in server memory only for the active session and never logged or stored
- All audit commands are read-only — no system changes are made during audit
- The app binds to `127.0.0.1` only — not accessible from the network
- Fix scripts must be manually reviewed before execution on production systems
- The `.env` file is gitignored — never commit it

---

## License

MIT License — free for educational and commercial use.
