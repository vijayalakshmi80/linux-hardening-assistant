# 🐳 Docker Test Environment Quick Start Guide

This guide helps you quickly set up and test the Linux Hardening Assistant using Docker.

---

## ✅ Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Node.js 20+ and npm 10+

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Docker Test Target

Open Command Prompt and run:

```cmd
docker-compose up -d
```

Or simply double-click: **`start-docker-target.cmd`**

This will:
- Build the Ubuntu 22.04 test container (first time only, takes ~2 minutes)
- Start SSH, MySQL, and Redis services
- Expose SSH on port 2222

**Wait for 10 seconds** for services to fully start.

### Step 2: Start the Backend

Open a **new terminal**:

```cmd
cd backend
npm install   # First time only
npm run dev
```

The backend starts on **http://localhost:3001**

### Step 3: Start the Frontend

Open **another terminal**:

```cmd
cd frontend
npm install   # First time only
npm run dev
```

The UI opens at **http://localhost:3002**

---

## 🔌 Connect to the Test Target

In the Linux Hardening Assistant UI:

| Field | Value |
|-------|-------|
| **Host** | `localhost` |
| **Port** | `2222` |
| **Username** | `testuser` |
| **Password** | `testpass123` |

### Alternative: Root Access

| Field | Value |
|-------|-------|
| **Username** | `root` |
| **Password** | `testroot123` |

---

## 🎯 What to Expect

After running the audit, you should see:

- **Security Score:** ~35-45/100 (Critical/Poor grade)
- **Critical Findings:**
  - MySQL exposed on 0.0.0.0:3306
  - Redis exposed on 0.0.0.0:6379
- **High Findings:**
  - Root SSH login enabled
  - Password authentication enabled
  - Weak /etc/shadow permissions
- **Medium Findings:**
  - No firewall (UFW not installed)
  - No Fail2Ban
  - World-writable files
  - Pending security updates
- **Low Findings:**
  - No Auditd
  - Weak password aging policy

---

## 🛑 Stop the Test Environment

```cmd
docker-compose down
```

Or double-click: **`stop-docker-target.cmd`**

---

## 🔧 Troubleshooting

### "Port 2222 already in use"

**Option 1:** Find and kill the process using port 2222
```cmd
netstat -ano | findstr :2222
taskkill /PID <process_id> /F
```

**Option 2:** Change the port in `docker-compose.yml`:
```yaml
ports:
  - "2223:22"  # Use 2223 instead
```

Then connect using port 2223 in the UI.

### "Cannot connect to the Docker daemon"

- Make sure Docker Desktop is running
- Check the Docker Desktop icon in the system tray
- Restart Docker Desktop if needed

### "Connection refused" when connecting via SSH

The container might still be starting up. Wait 10-15 seconds and try again.

Check container logs:
```cmd
docker logs linux-hardening-test-target
```

You should see "Starting SSH..." at the end.

### SSH connection test (manual)

Test the SSH connection directly:
```cmd
ssh -p 2222 testuser@localhost
```

Password: `testpass123`

If this works, the container is ready.

### Container won't start

View error logs:
```cmd
docker logs linux-hardening-test-target
```

Rebuild the container:
```cmd
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backend/Frontend connection issues

Make sure:
- Backend is running on port **3001** (check `.env` file: `PORT=3001`)
- Frontend is running on port **3002** (check `frontend/vite.config.ts`)
- No firewall blocking localhost connections

---

## 🧪 Testing the Full Workflow

1. **Start Docker target** (as shown above)
2. **Start backend and frontend**
3. **Open http://localhost:3002**
4. **Click "Connect"** → Enter credentials → Click "Connect"
5. **See "Connected" badge** (green)
6. **Click "Run Audit"** → Wait 10-20 seconds
7. **Click "Analyze"** → See security score and findings
8. **Click "Download Fix Script"** → Get `fix.sh` file
9. **Click "Export PDF"** → Get full PDF report
10. **Test Chat** (if Gemini key is configured) → Ask questions about findings

---

## 📊 Expected Results

### Server Info
- **OS:** Ubuntu 22.04.X LTS
- **Kernel:** 5.x or 6.x
- **Hostname:** vulnerable-ubuntu
- **CPU/Memory:** Varies based on Docker Desktop settings

### Findings Count
- **Critical:** 2 findings (open ports)
- **High:** 3 findings (SSH + permissions)
- **Medium:** 4 findings (firewall, fail2ban, updates, world-writable)
- **Low:** 2 findings (auditd, password policy)

### Fix Script
Should include commands like:
```bash
# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Enable UFW
apt-get install -y ufw
ufw --force enable

# Fix /etc/shadow permissions
chmod 640 /etc/shadow
```

---

## 🔄 Resetting the Test Environment

To get a fresh container with all misconfigurations:

```cmd
docker-compose down
docker-compose up -d
```

The container is rebuilt from the Dockerfile each time, so all changes are reset.

---

## 📝 Notes

- The Docker container is **intentionally vulnerable** for testing purposes
- **DO NOT expose this container to the internet**
- **DO NOT use in production**
- The container uses predictable passwords for convenience in testing
- All data in the container is ephemeral (lost when you run `docker-compose down`)

---

## 🎓 Next Steps

Once you've tested with Docker:

1. Try **Demo Mode** (no Docker or SSH needed)
2. Configure your **Gemini API key** in `.env` to enable AI analysis
3. Test with a **real Linux VM** (WSL, VirtualBox, VMware)
4. Try **applying the fix script** on the Docker container:
   ```bash
   docker exec -it linux-hardening-test-target bash
   chmod +x /path/to/fix.sh
   ./path/to/fix.sh
   ```
5. **Re-run the audit** to see the improved score!

---

## 🆘 Need Help?

- Check the main [README.md](README.md) for full documentation
- View container logs: `docker logs linux-hardening-test-target`
- Access container shell: `docker exec -it linux-hardening-test-target bash`
- Check if services are running inside container:
  ```bash
  docker exec -it linux-hardening-test-target netstat -tlnp
  ```

---

## 🎉 Success Indicators

You know everything is working when:

- ✅ Docker container shows "healthy" status
- ✅ You can connect via SSH (green "Connected" badge)
- ✅ Audit completes successfully (16 checks)
- ✅ Security score appears (around 35-45/100)
- ✅ Fix script downloads successfully
- ✅ PDF export works

Happy hardening! 🛡️
