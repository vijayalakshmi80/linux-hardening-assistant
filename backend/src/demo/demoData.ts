/**
 * Demo mode data — realistic Ubuntu 22.04 audit results.
 *
 * No SSH or Gemini API required.
 * Provides a complete analysis report with High, Medium, and Low findings.
 */

import type { AuditData, AuditFinding, AnalysisReport } from '../utils/types';
import { calculateScore, classifyFindings } from '../auditors/scoreEngine';
import { generateFixScript } from '../auditors/fixScriptGenerator';

const DEMO_HOST = '192.168.1.50';
const DEMO_USERNAME = 'demo';

export function getDemoAuditData(): AuditData {
  return {
    host: DEMO_HOST,
    username: DEMO_USERNAME,
    server_info: {
      os_name: 'Ubuntu 22.04.4 LTS',
      os_version: '22.04',
      kernel: 'Linux demo-server 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux',
    },
    audit_results: {
      ssh_password_auth: {
        description: 'SSH password authentication setting',
        command: 'grep -E "^\\s*PasswordAuthentication" /etc/ssh/sshd_config',
        output: 'PasswordAuthentication yes',
        exit_code: '0',
      },
      ssh_root_login: {
        description: 'SSH root login configuration',
        command: 'grep -E "^\\s*PermitRootLogin" /etc/ssh/sshd_config',
        output: 'PermitRootLogin yes',
        exit_code: '0',
      },
      ssh_service_enabled: {
        description: 'SSH service enabled state',
        command: 'systemctl is-enabled ssh',
        output: 'enabled',
        exit_code: '0',
      },
      ufw_status: {
        description: 'UFW firewall status',
        command: 'ufw status',
        output: 'Status: inactive',
        exit_code: '0',
      },
      fail2ban_status: {
        description: 'Fail2Ban intrusion prevention status',
        command: 'systemctl is-active fail2ban',
        output: 'inactive',
        exit_code: '3',
      },
      auditd_status: {
        description: 'Auditd logging daemon status',
        command: 'systemctl is-active auditd',
        output: 'inactive',
        exit_code: '3',
      },
      open_ports: {
        description: 'Open listening network ports',
        command: 'ss -tuln',
        output: [
          'Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port',
          'tcp    LISTEN  0       128     0.0.0.0:22           0.0.0.0:*',
          'tcp    LISTEN  0       128     0.0.0.0:80           0.0.0.0:*',
          'tcp    LISTEN  0       128     0.0.0.0:3306         0.0.0.0:*',
          'tcp    LISTEN  0       128     0.0.0.0:6379         0.0.0.0:*',
          'tcp    LISTEN  0       128     *:8080               *:*',
        ].join('\n'),
        exit_code: '0',
      },
      running_services: {
        description: 'Running system services',
        command: 'systemctl list-units --type=service --state=running',
        output: [
          'ssh.service        loaded active running OpenBSD Secure Shell server',
          'mysql.service      loaded active running MySQL Community Server',
          'redis.service      loaded active running Advanced key-value store',
          'apache2.service    loaded active running The Apache HTTP Server',
          'cron.service       loaded active running Regular background program processing daemon',
        ].join('\n'),
        exit_code: '0',
      },
      password_policy: {
        description: 'Password aging and complexity policy',
        command: 'grep -E "^(PASS_MAX_DAYS|PASS_MIN_DAYS|PASS_WARN_AGE)" /etc/login.defs',
        output: 'PASS_MAX_DAYS\t99999\nPASS_MIN_DAYS\t0\nPASS_WARN_AGE\t7',
        exit_code: '0',
      },
      sudo_users: {
        description: 'Users with sudo group membership',
        command: 'getent group sudo',
        output: 'sudo:x:27:ubuntu,deploy',
        exit_code: '0',
      },
      os_release: {
        description: 'Operating system release information',
        command: 'cat /etc/os-release',
        output: [
          'PRETTY_NAME="Ubuntu 22.04.4 LTS"',
          'NAME="Ubuntu"',
          'VERSION_ID="22.04"',
          'ID=ubuntu',
          'ID_LIKE=debian',
        ].join('\n'),
        exit_code: '0',
      },
      kernel_info: {
        description: 'Kernel and system information',
        command: 'uname -a',
        output: 'Linux demo-server 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux',
        exit_code: '0',
      },
      pending_updates: {
        description: 'Number of pending system updates',
        command: 'apt list --upgradable 2>/dev/null | wc -l',
        output: '23',
        exit_code: '0',
      },
      world_writable_files: {
        description: 'World-writable files in sensitive directories',
        command: 'find /etc /usr/bin /usr/sbin -maxdepth 2 -perm -o+w',
        output: 'NONE',
        exit_code: '0',
      },
      file_permissions: {
        description: 'Permissions on critical system files',
        command: 'stat -c "%a %n" /etc/passwd /etc/shadow /etc/sudoers /etc/ssh/sshd_config',
        output: '644 /etc/passwd\n640 /etc/shadow\n440 /etc/sudoers\n600 /etc/ssh/sshd_config',
        exit_code: '0',
      },
      swap_status: {
        description: 'Swap space configuration',
        command: 'swapon --show',
        output: 'NAME      TYPE  SIZE USED PRIO\n/swap.img file  2G   0B   -2',
        exit_code: '0',
      },
    },
    errors: [],
    timestamp: new Date().toISOString(),
  };
}

export function getDemoFindings(): AuditFinding[] {
  return [
    {
      issue_name: 'Root SSH Login Enabled',
      severity: 'High',
      explanation:
        'PermitRootLogin is set to "yes". Direct root access over SSH increases the blast radius of credential compromise and automated brute-force attacks.',
      fix_command:
        "sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo systemctl restart ssh",
      recommendation: 'Disable root SSH login. Use a regular account and escalate with sudo.',
      weight: 15,
    },
    {
      issue_name: 'SSH Password Authentication Enabled',
      severity: 'High',
      explanation:
        'PasswordAuthentication is enabled. This exposes the SSH service to brute-force and credential-stuffing attacks.',
      fix_command:
        "sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl restart ssh",
      recommendation:
        'Switch to SSH key-based authentication. Disable password auth after confirming key access works.',
      weight: 15,
    },
    {
      issue_name: 'Database Services Exposed on All Interfaces',
      severity: 'Critical',
      explanation:
        'MySQL (3306) and Redis (6379) are listening on 0.0.0.0. With the firewall disabled, these are accessible from any host on the local network.',
      fix_command:
        "sudo sed -i 's/^bind-address.*/bind-address = 127.0.0.1/' /etc/mysql/mysql.conf.d/mysqld.cnf && sudo systemctl restart mysql && sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf && sudo systemctl restart redis",
      recommendation:
        'Bind all database and cache services to 127.0.0.1. Use UFW rules to restrict access if remote connectivity is required.',
      weight: 20,
    },
    {
      issue_name: 'Host Firewall (UFW) Disabled',
      severity: 'Medium',
      explanation:
        'UFW is inactive. All listening services are directly reachable from the network without host-level packet filtering.',
      fix_command:
        'sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw allow 22/tcp && sudo ufw --force enable',
      recommendation:
        'Enable UFW with a default-deny inbound policy. Explicitly allow only required ports.',
      weight: 10,
    },
    {
      issue_name: 'Fail2Ban Not Running',
      severity: 'Medium',
      explanation:
        'Fail2Ban is not active. Without it, brute-force attempts against SSH are not automatically blocked.',
      fix_command:
        'sudo apt-get install -y fail2ban && sudo systemctl enable fail2ban && sudo systemctl start fail2ban',
      recommendation: 'Install and enable Fail2Ban with SSH jail configuration.',
      weight: 8,
    },
    {
      issue_name: 'Pending System Updates (22)',
      severity: 'Medium',
      explanation:
        '22 packages have available updates. Unpatched systems may be vulnerable to known CVEs.',
      fix_command:
        'sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y',
      recommendation: 'Apply pending updates and enable unattended-upgrades for security patches.',
      weight: 7,
    },
    {
      issue_name: 'Auditd Logging Not Running',
      severity: 'Low',
      explanation:
        'The audit daemon is not active. Privileged actions and file changes will not be logged for forensic review.',
      fix_command:
        'sudo apt-get install -y auditd && sudo systemctl enable auditd && sudo systemctl start auditd',
      recommendation: 'Enable auditd and configure rules for critical files and sudo commands.',
      weight: 5,
    },
    {
      issue_name: 'Weak Password Aging Policy',
      severity: 'Low',
      explanation:
        'PASS_MAX_DAYS is set to 99999 (effectively never expires). Long-lived passwords increase the exposure window for compromised credentials.',
      fix_command:
        "sudo sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   90/' /etc/login.defs && sudo sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS   1/' /etc/login.defs",
      recommendation: 'Set maximum password age to 90 days and minimum to 1 day.',
      weight: 3,
    },
  ];
}

export function buildDemoReport(): { audit: AuditData; report: AnalysisReport } {
  const audit = getDemoAuditData();
  const findings = getDemoFindings();
  const scoreBreakdown = calculateScore(findings);
  const findingsBySeverity = classifyFindings(findings);
  const fixScript = generateFixScript(findings);

  const report: AnalysisReport = {
    success: true,
    mode: 'local',
    security_score: scoreBreakdown.final,
    score_breakdown: scoreBreakdown,
    grade: scoreBreakdown.grade,
    summary:
      'The demo server has critical SSH misconfigurations, an inactive firewall, and exposed database services. ' +
      'Immediate remediation is recommended for high and critical severity findings.',
    executive_summary:
      `Security assessment of the demo Ubuntu 22.04 server (${DEMO_HOST}) scored ${scoreBreakdown.final}/100 (${scoreBreakdown.grade}). ` +
      'Critical issues include enabled root SSH login, password authentication, and database services exposed on all interfaces. ' +
      'The host firewall is disabled, significantly increasing network exposure. Prompt hardening is required.',
    findings,
    findings_by_severity: findingsBySeverity,
    fix_script: fixScript,
    priority_actions: [
      'Disable root SSH login (PermitRootLogin no)',
      'Disable SSH password authentication — switch to key-based auth',
      'Enable UFW firewall with default-deny inbound policy',
      'Bind MySQL and Redis to 127.0.0.1',
      'Install and enable Fail2Ban',
    ],
    compliance_notes:
      'Findings align with CIS Ubuntu 22.04 Benchmark L1 requirements for SSH hardening, ' +
      'firewall configuration, and service exposure.',
    verification_notes: 'Demo mode — pre-validated sample findings. No AI or SSH required.',
    workflow_steps: [
      {
        step: 'collect_data',
        status: 'success',
        message: 'Demo mode: loaded sample Ubuntu 22.04 audit data (no SSH required).',
        data: { source: 'demo', checks: 16 },
        timestamp: new Date().toISOString(),
      },
      {
        step: 'analyze',
        status: 'success',
        message: `Identified ${findings.length} findings using pre-built demo analysis.`,
        data: {
          critical: findingsBySeverity.Critical.length,
          high: findingsBySeverity.High.length,
          medium: findingsBySeverity.Medium.length,
          low: findingsBySeverity.Low.length,
        },
        timestamp: new Date().toISOString(),
      },
      {
        step: 'generate_fixes',
        status: 'success',
        message: `Fix script generated with ${findings.length} remediation commands.`,
        data: { lines: fixScript.split('\n').length },
        timestamp: new Date().toISOString(),
      },
      {
        step: 'verify_recommendations',
        status: 'success',
        message: 'Demo mode — findings are pre-validated.',
        data: {},
        timestamp: new Date().toISOString(),
      },
      {
        step: 'produce_final_report',
        status: 'success',
        message: 'Demo report ready.',
        data: { score: scoreBreakdown.final, grade: scoreBreakdown.grade },
        timestamp: new Date().toISOString(),
      },
    ],
    audit_data: audit,
    timestamp: new Date().toISOString(),
  };

  return { audit, report };
}
