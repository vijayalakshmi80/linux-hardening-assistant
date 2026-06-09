# Docker Test Target

This directory contains a deliberately vulnerable Ubuntu 22.04 Docker image for testing the Linux Hardening Assistant.

## ⚠️ WARNING

**DO NOT USE IN PRODUCTION**

This container is intentionally configured with severe security vulnerabilities for testing purposes only. It should never be exposed to the internet or used in any production environment.

## What's Inside

- **OS:** Ubuntu 22.04 LTS
- **Services:** OpenSSH, MySQL, Redis
- **Users:**
  - `root` / `testroot123` (sudo access)
  - `testuser` / `testpass123` (sudo access)

## Intentional Security Issues

| Category | Issue | Detection |
|----------|-------|-----------|
| SSH | Root login enabled | Critical |
| SSH | Password authentication enabled | High |
| Network | MySQL on 0.0.0.0:3306 | Critical |
| Network | Redis on 0.0.0.0:6379 | Critical |
| Firewall | UFW not installed | Medium |
| IDS | Fail2Ban not installed | Medium |
| Logging | Auditd not installed | Low |
| Files | World-writable files in /etc | Medium |
| Files | /etc/shadow has 644 permissions | High |
| Policy | No password aging (99999 days) | Low |
| Updates | Pending security updates | Medium |

**Expected audit score:** 35-45/100 (Critical/Poor)

## Usage

### Build and Start
```bash
docker-compose up -d
```

### Check Status
```bash
docker ps
docker logs linux-hardening-test-target
```

### Connect via SSH (manual test)
```bash
ssh -p 2222 testuser@localhost
# Password: testpass123
```

### Access Shell Directly
```bash
docker exec -it linux-hardening-test-target bash
```

### Stop
```bash
docker-compose down
```

### Rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Connection Details for the App

Use these settings in the Linux Hardening Assistant UI:

- **Host:** `localhost`
- **Port:** `2222`
- **Username:** `testuser`
- **Password:** `testpass123`

Or for root access:
- **Username:** `root`
- **Password:** `testroot123`

## Customization

### Change Port Mapping

Edit `docker-compose.yml`:
```yaml
ports:
  - "2223:22"  # Use port 2223 instead of 2222
```

### Change Passwords

Edit the `environment` section in `docker-compose.yml`:
```yaml
environment:
  - ROOT_PASSWORD=your-root-password
  - USER_PASSWORD=your-user-password
```

### Add More Vulnerabilities

Edit `Dockerfile` to add more misconfigurations for testing.

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :2222

# Change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker logs linux-hardening-test-target

# Remove and recreate
docker-compose down
docker-compose up -d
```

### SSH Connection Refused
```bash
# Container might still be initializing
# Wait 10 seconds and try again

# Or check if SSH is running inside
docker exec -it linux-hardening-test-target service ssh status
```

## Network Architecture

```
Host Machine (Windows)
    ↓
  localhost:2222 (SSH)
    ↓
  Docker Bridge Network
    ↓
  Container (linux-hardening-test-target)
    ↓
  Ubuntu 22.04
    - SSH on :22
    - MySQL on :3306
    - Redis on :6379
```

## Security Notes

- Passwords are hardcoded for testing convenience
- All services listen on 0.0.0.0 for maximum detection
- No encryption or security hardening applied
- Root access allowed via SSH
- No rate limiting or intrusion prevention
- Audit logs disabled

## License

MIT License - For testing purposes only
