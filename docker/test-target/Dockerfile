# ============================================================
# Deliberately Vulnerable Ubuntu 22.04 Test Target
# For Linux Hardening Assistant Testing
# ============================================================
# DO NOT USE IN PRODUCTION - INTENTIONALLY INSECURE
# ============================================================

FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install OpenSSH server and common services for testing
RUN apt-get update && apt-get install -y \
    openssh-server \
    sudo \
    mysql-server \
    redis-server \
    curl \
    wget \
    vim \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create SSH directory
RUN mkdir -p /var/run/sshd

# ============================================================
# INTENTIONAL SECURITY MISCONFIGURATIONS (FOR TESTING)
# ============================================================

# 1. Configure SSH with weak security settings
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    echo "PermitEmptyPasswords no" >> /etc/ssh/sshd_config

# 2. Configure MySQL to listen on all interfaces (0.0.0.0)
RUN sed -i 's/bind-address\s*=.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf 2>/dev/null || true

# 3. Configure Redis to listen on all interfaces
RUN sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf 2>/dev/null || true && \
    sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf 2>/dev/null || true

# 4. Weak password policy (no aging, no complexity requirements)
RUN sed -i 's/PASS_MAX_DAYS\t99999/PASS_MAX_DAYS\t99999/' /etc/login.defs && \
    sed -i 's/PASS_MIN_DAYS\t0/PASS_MIN_DAYS\t0/' /etc/login.defs

# 5. Create world-writable files in sensitive locations
RUN touch /etc/sensitive-config.conf && \
    chmod 777 /etc/sensitive-config.conf && \
    touch /tmp/world-writable-test.txt && \
    chmod 777 /tmp/world-writable-test.txt

# 6. Set weak permissions on /etc/shadow (should be 640, we make it 644)
RUN chmod 644 /etc/shadow

# 7. UFW is not installed (no firewall)
# 8. Fail2Ban is not installed (no intrusion prevention)
# 9. Auditd is not installed (no audit logging)

# ============================================================
# User Setup
# ============================================================

# Set root password
ARG ROOT_PASSWORD=testroot123
RUN echo "root:${ROOT_PASSWORD}" | chpasswd

# Create test user with sudo privileges
ARG USER_NAME=testuser
ARG USER_PASSWORD=testpass123
RUN useradd -m -s /bin/bash ${USER_NAME} && \
    echo "${USER_NAME}:${USER_PASSWORD}" | chpasswd && \
    usermod -aG sudo ${USER_NAME} && \
    echo "${USER_NAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ============================================================
# Startup Script
# ============================================================

# Create startup script that launches all services
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "=========================================================="\n\
echo "Starting Vulnerable Ubuntu Test Target"\n\
echo "=========================================================="\n\
echo "SSH Access:"\n\
echo "  Host: localhost"\n\
echo "  Port: 2222"\n\
echo "  Root: root / testroot123"\n\
echo "  User: testuser / testpass123"\n\
echo "=========================================================="\n\
echo "Intentional Security Issues:"\n\
echo "  ✗ Root SSH login enabled"\n\
echo "  ✗ Password authentication enabled"\n\
echo "  ✗ No firewall (UFW not installed)"\n\
echo "  ✗ No Fail2Ban"\n\
echo "  ✗ No Auditd"\n\
echo "  ✗ MySQL listening on 0.0.0.0:3306"\n\
echo "  ✗ Redis listening on 0.0.0.0:6379"\n\
echo "  ✗ World-writable files in /etc"\n\
echo "  ✗ Weak /etc/shadow permissions (644 instead of 640)"\n\
echo "  ✗ No password aging policy"\n\
echo "=========================================================="\n\
\n\
# Start MySQL\n\
echo "Starting MySQL..."\n\
service mysql start || echo "MySQL failed to start (expected in some environments)"\n\
\n\
# Start Redis\n\
echo "Starting Redis..."\n\
service redis-server start || echo "Redis failed to start (expected in some environments)"\n\
\n\
# Start SSH\n\
echo "Starting SSH..."\n\
/usr/sbin/sshd -D\n\
' > /start.sh && chmod +x /start.sh

# Expose SSH port
EXPOSE 22

# Start services
CMD ["/start.sh"]
