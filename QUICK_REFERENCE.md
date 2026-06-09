# 🚀 Quick Reference Card

## Start Everything (3 Commands)

```cmd
# 1. Start Docker container
docker-compose up -d

# 2. Start backend (new terminal)
cd backend && npm run dev

# 3. Start frontend (new terminal)  
cd frontend && npm run dev
```

Then open: **http://localhost:3002**

---

## Connection Details

| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `2222` |
| Username | `testuser` |
| Password | `testpass123` |

---

## Stop Everything

```cmd
docker-compose down
```

(Ctrl+C in backend and frontend terminals)

---

## Useful Commands

```cmd
# Check container status
docker ps

# View logs
docker logs linux-hardening-test-target

# Access shell
docker exec -it linux-hardening-test-target bash

# Rebuild container
docker-compose down && docker-compose build && docker-compose up -d

# Test SSH manually
ssh -p 2222 testuser@localhost
```

---

## Ports

- **Frontend:** http://localhost:3002
- **Backend:** http://localhost:3001
- **SSH:** localhost:2222
- **MySQL:** localhost:3306
- **Redis:** localhost:6379

---

## Expected Results

- **Score:** ~35-45/100 (Critical/Poor)
- **Critical:** 2 findings
- **High:** 3 findings
- **Medium:** 4 findings
- **Low:** 2 findings

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Wait 10 seconds, check logs |
| Port in use | Change port in docker-compose.yml |
| Backend error | Check .env has PORT=3001 |
| Frontend error | Check vite.config.ts port 3002 |

---

## Helper Scripts (Windows)

- **start-docker-target.cmd** — Start container
- **stop-docker-target.cmd** — Stop container

---

## Documentation

- **DOCKER_GUIDE.md** — Full setup guide
- **DOCKER_SETUP_COMPLETE.md** — What was created
- **README.md** — Project documentation

---

## Security Reminder

⚠️ This is a **vulnerable test container** — localhost only!
