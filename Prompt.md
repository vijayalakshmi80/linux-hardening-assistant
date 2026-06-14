# AI Project Specification – Linux Hardening Assistant

## Initial Prompt Used for Project Conceptualization

You are a senior full-stack security engineer.

I have a Linux Hardening Assistant project built with a frontend and backend. The application currently connects to Linux machines using SSH, calculates a security score, generates fix scripts, and provides AI analysis.

I only want this project to run on localhost for now. Do NOT optimize for Render or cloud deployment.

Please refactor and improve the entire project with the following requirements:

---

## 1. Localhost Development Only

* The application should run entirely on my own computer.
* Backend runs locally.
* Frontend runs locally.
* Remove assumptions that the backend can access public servers.
* Clearly document localhost setup.

---

## 2. SSH Improvements

Support SSH connections to:

* WSL Ubuntu
* VirtualBox Ubuntu virtual machines
* Linux machines on the same LAN

Requirements:

* Add configurable SSH timeout (30 seconds).
* Provide meaningful error messages:

  * Authentication failed
  * Host unreachable
  * SSH timeout
  * Connection refused
* Validate IP addresses before connecting.
* Detect private IP ranges and allow them because localhost mode is intended for private networks:

  * 192.168.x.x
  * 172.16.x.x – 172.31.x.x
  * 10.x.x.x

---

## 3. Demo Mode Improvements

* Keep Demo Mode.

* Store demo audit data in a separate JSON file.

* Display a clear banner:

  "Demo Mode: No real SSH connection is being used."

* Allow switching between:

  * Demo Mode
  * Real Audit Mode

---

## 4. Security Audit Improvements

Audit the following:

* SSH password authentication
* SSH root login status
* UFW firewall status
* Fail2Ban status
* Auditd status
* Open network ports
* Password policies
* Running services
* Operating system version
* Kernel version
* User accounts with sudo privileges

Generate a security score from 0–100 based on findings.

---

## 5. Fix Script Generation

Generate a downloadable `fix.sh` script.

The script should:

* Enable UFW safely.
* Disable root SSH login.
* Enable Fail2Ban.
* Enable Auditd.
* Harden SSH configuration.
* Include comments explaining every change.
* Ask for confirmation before applying changes.

---

## 6. AI Analysis

Implement two modes.

### A. Gemini Mode

* Use `GEMINI_API_KEY` from `.env`.
* If available, provide detailed explanations:

  * Risks
  * Severity
  * Recommended fixes
  * Impact

### B. Local Mode

If `GEMINI_API_KEY` is missing:

* Do NOT display errors.
* Use built-in rule-based explanations instead.
* Display the message:

  "AI key not configured. Using local recommendations."

---

## 7. User Interface Improvements

Implement:

* Connection status badges:

  * Connected
  * Connecting
  * Disconnected
  * Failed

* Loading indicators.

* Improved error notifications.

* Disable audit buttons while an audit is running.

* Show timestamps for audits.

---

## 8. Project Structure

Refactor the project into the following structure:

frontend/

backend/

backend/services/

backend/auditors/

backend/ssh/

backend/utils/

backend/demo/

backend/ai/

backend/scripts/

Separate business logic from routes.

---

## 9. Documentation

Generate a complete README including:

* Project overview
* Features
* Local installation steps
* WSL setup instructions
* Ubuntu VM setup instructions
* How to enable SSH
* How to obtain a Gemini API key
* How Demo Mode works
* Troubleshooting guide

---

## 10. Code Quality

Improve the codebase by:

* Removing unused code.
* Adding comments.
* Improving error handling.
* Using environment variables.
* Adding input validation.
* Ensuring reliable localhost execution.

---

## Final Deliverables

After implementing the changes:

* Show all modified files.
* Explain why each change was made.
* Generate a step-by-step testing checklist to verify the project.
* Ensure the Linux Hardening Assistant operates reliably in a localhost environment.

---

## Declaration

This prompt was used during the conceptualization and refinement phase of the Linux Hardening Assistant project to define requirements, architecture improvements, and expected deliverables. Final implementation, debugging, testing, deployment, and validation were performed by the project team.
You are a Senior Full Stack Security Engineer and DevOps Architect.

I have an existing Linux Hardening Assistant project that was originally built with AI assistance. I want you to refactor, improve, and complete the project.

IMPORTANT:
- This application is currently intended to run ONLY on localhost.
- Do NOT optimize for Render or public deployment.
- Focus on reliability, maintainability, and local usability.
- Explain all changes and generate code automatically.

PROJECT GOAL

Build a complete Linux Hardening Assistant that allows users to:

1. Connect to Linux systems via SSH.
2. Perform automated Linux security audits.
3. Generate a security score (0–100).
4. Explain security findings.
5. Generate fix scripts.
6. Use Gemini AI when configured.
7. Fall back to local analysis when Gemini is unavailable.
8. Export reports.

SUPPORTED TARGETS

The application must support auditing:

- Ubuntu WSL
- Ubuntu Server in VirtualBox
- VMware Linux VMs
- Linux machines on the same LAN

Do NOT assume public internet access.

====================================================
TECH STACK
====================================================

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express
- TypeScript

SSH:
- ssh2

AI:
- Google Gemini API

Export:
- PDF generation

Environment:
- dotenv

====================================================
PROJECT STRUCTURE
====================================================

frontend/
backend/

backend/
    routes/
    controllers/
    services/
    auditors/
    ssh/
    ai/
    scripts/
    demo/
    utils/
    middleware/
    config/

====================================================
SSH CONNECTION SYSTEM
====================================================

Implement a robust SSH system.

Requirements:

- Host/IP
- Port
- Username
- Password

Validation:
- Validate IP addresses.
- Validate ports.
- Reject invalid inputs.

Timeout:
- Configurable timeout.
- Default: 30 seconds.

Error Handling:

Authentication failed:
"Invalid username or password."

Timeout:
"Target machine did not respond within 30 seconds."

Connection refused:
"SSH service is unavailable."

Host unreachable:
"Target host cannot be reached."

Unknown:
"Unexpected SSH error occurred."

Allow private IP ranges:

- 192.168.x.x
- 172.16–31.x.x
- 10.x.x.x

because localhost mode is intended for local networks.

====================================================
AUDIT MODULES
====================================================

Implement auditors for:

1. SSH password authentication
2. Root SSH login status
3. SSH service enabled state
4. UFW firewall status
5. Fail2Ban status
6. Auditd status
7. Open network ports
8. Running services
9. Password policies
10. Sudo users
11. OS version
12. Kernel version
13. Installed updates
14. World-writable files
15. File permission checks
16. Swap status

Each auditor should:

- Return status
- Risk level
- Recommendation
- Fix command
- Weight

====================================================
SECURITY SCORE
====================================================

Generate a score from 0–100.

Rules:

Critical issues:
-20

High:
-10

Medium:
-5

Low:
-2

Display:

Excellent:
90–100

Good:
75–89

Moderate:
60–74

Poor:
40–59

Critical:
0–39

====================================================
FIX SCRIPT GENERATOR
====================================================

Generate downloadable:

fix.sh

Requirements:

- Include comments.
- Ask for confirmation before execution.
- Explain risks.
- Use safe defaults.

Fixes:

- Disable root SSH login
- Disable password authentication
- Enable Fail2Ban
- Enable Auditd
- Enable UFW
- Configure UFW SSH rules
- Harden SSH config
- Restart services

Example:

read -p "Apply fixes? (yes/no): " ans

====================================================
AI ANALYSIS
====================================================

Implement two modes.

------------------------------------
Mode A: Gemini AI
------------------------------------

Use:

GEMINI_API_KEY

Generate:

- Summary
- Risks
- Severity
- Recommendations
- Hardening strategy

Use:

@google/generative-ai

Implement retry logic.

Gracefully handle failures.

------------------------------------
Mode B: Local Analysis
------------------------------------

If GEMINI_API_KEY is absent:

DO NOT FAIL.

Display:

"Gemini API key not configured. Using local recommendations."

Generate recommendations using rule-based templates.

====================================================
API CONFIGURATION
====================================================

Create:

.env.example

Include:

PORT=5000

NODE_ENV=development

GEMINI_API_KEY=

SSH_TIMEOUT=30000

JWT_SECRET=

REPORT_STORAGE=./reports

Enable dotenv.

Validate environment variables.

====================================================
API ENDPOINTS
====================================================

POST /api/connect

POST /api/audit

POST /api/analyze

POST /api/fix-script

POST /api/demo

GET /api/reports

GET /api/health

GET /api/version

Each endpoint must have:

- Validation
- Error handling
- Logging

====================================================
DEMO MODE
====================================================

Keep Demo Mode.

Store demo results in JSON.

Display banner:

"Demo Mode: No real SSH connection is being used."

Allow switching between:

- Demo Mode
- Real Audit Mode

====================================================
FRONTEND IMPROVEMENTS
====================================================

Improve UX.

Connection states:

- Connected
- Connecting
- Disconnected
- Failed

Show:

- Loading spinners
- Toast notifications
- Audit timestamps
- Error messages

Disable buttons during execution.

====================================================
PDF EXPORT
====================================================

Generate PDF reports containing:

- Security score
- Findings
- Recommendations
- AI analysis
- Fix commands
- Audit timestamp

====================================================
README
====================================================

Generate a complete README.

Include:

Project overview

Features

Local installation

Frontend setup

Backend setup

WSL setup

VirtualBox setup

SSH setup

Gemini setup

Environment variables

Troubleshooting

Demo Mode explanation

Testing instructions

====================================================
TESTING
====================================================

Generate:

Manual testing checklist.

Test cases for:

SSH success

Authentication failure

Timeout

Demo Mode

Gemini Mode

Local Analysis Mode

PDF generation

Fix script generation

====================================================
OUTPUT REQUIREMENTS
====================================================

1. Show all modified files.
2. Explain why each change was made.
3. Generate missing code.
4. Refactor duplicated logic.
5. Improve maintainability.
6. Ensure the application works completely on localhost.
7. Do not leave TODOs.
8. Deliver a fully working implementation.
