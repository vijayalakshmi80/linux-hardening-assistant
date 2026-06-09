/**
 * SSH2-based client for connecting to Linux servers
 * and executing read-only security audit commands.
 *
 * Supports: Ubuntu WSL, VirtualBox VMs, VMware VMs, LAN Linux machines.
 */

import { Client, ConnectConfig } from 'ssh2';
import { logger } from '../config/logger';
import { config } from '../config/env';
import type { AuditData, AuditResult, ServerInfo } from '../utils/types';

// ── Error types ──────────────────────────────────────────────────────────────

export type SSHErrorType =
  | 'auth_error'
  | 'timeout'
  | 'connection_refused'
  | 'host_unreachable'
  | 'not_connected'
  | 'command_error'
  | 'command_timeout'
  | 'ssh_error'
  | 'unknown_error';

export class SSHConnectionError extends Error {
  constructor(
    message: string,
    public readonly errorType: SSHErrorType = 'unknown_error',
  ) {
    super(message);
    this.name = 'SSHConnectionError';
  }
}

// ── Audit command definitions ─────────────────────────────────────────────────

interface AuditCommand {
  key: string;
  command: string;
  description: string;
}

/**
 * 16 read-only audit checks aligned with the project spec.
 * All commands are safe — no writes, no side effects.
 */
const AUDIT_COMMANDS: AuditCommand[] = [
  {
    key: 'ssh_password_auth',
    command: 'grep -E "^\\s*PasswordAuthentication" /etc/ssh/sshd_config 2>/dev/null || echo "NOT_FOUND"',
    description: 'SSH password authentication setting',
  },
  {
    key: 'ssh_root_login',
    command: 'grep -E "^\\s*PermitRootLogin" /etc/ssh/sshd_config 2>/dev/null || echo "NOT_FOUND"',
    description: 'SSH root login configuration',
  },
  {
    key: 'ssh_service_enabled',
    command: 'systemctl is-enabled ssh 2>/dev/null || systemctl is-enabled sshd 2>/dev/null || echo "UNKNOWN"',
    description: 'SSH service enabled state',
  },
  {
    key: 'ufw_status',
    command: 'ufw status 2>/dev/null || echo "UFW_NOT_INSTALLED"',
    description: 'UFW firewall status',
  },
  {
    key: 'fail2ban_status',
    command: 'systemctl is-active fail2ban 2>/dev/null || echo "NOT_INSTALLED"',
    description: 'Fail2Ban intrusion prevention status',
  },
  {
    key: 'auditd_status',
    command: 'systemctl is-active auditd 2>/dev/null || echo "NOT_INSTALLED"',
    description: 'Auditd logging daemon status',
  },
  {
    key: 'open_ports',
    command: 'ss -tuln 2>/dev/null || netstat -tuln 2>/dev/null || echo "SS_NOT_AVAILABLE"',
    description: 'Open listening network ports',
  },
  {
    key: 'running_services',
    command: 'systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | head -40 || echo "UNAVAILABLE"',
    description: 'Running system services',
  },
  {
    key: 'password_policy',
    command: 'grep -E "^(PASS_MAX_DAYS|PASS_MIN_DAYS|PASS_WARN_AGE|PASS_MIN_LEN)" /etc/login.defs 2>/dev/null || echo "NOT_FOUND"',
    description: 'Password aging and complexity policy',
  },
  {
    key: 'sudo_users',
    command: 'getent group sudo 2>/dev/null || getent group wheel 2>/dev/null || echo "NOT_FOUND"',
    description: 'Users with sudo/wheel group membership',
  },
  {
    key: 'os_release',
    command: 'cat /etc/os-release 2>/dev/null || echo "OS_RELEASE_NOT_FOUND"',
    description: 'Operating system release information',
  },
  {
    key: 'kernel_info',
    command: 'uname -a 2>/dev/null || echo "UNAME_FAILED"',
    description: 'Kernel and system information',
  },
  {
    key: 'pending_updates',
    command: 'apt list --upgradable 2>/dev/null | wc -l || yum check-update 2>/dev/null | wc -l || echo "0"',
    description: 'Number of pending system updates',
  },
  {
    key: 'world_writable_files',
    command: 'find /etc /usr/bin /usr/sbin -maxdepth 2 -perm -o+w -not -type l 2>/dev/null | head -20 || echo "NONE"',
    description: 'World-writable files in sensitive directories',
  },
  {
    key: 'file_permissions',
    command: 'stat -c "%a %n" /etc/passwd /etc/shadow /etc/sudoers /etc/ssh/sshd_config 2>/dev/null || echo "STAT_FAILED"',
    description: 'Permissions on critical system files',
  },
  {
    key: 'swap_status',
    command: 'swapon --show 2>/dev/null || echo "NO_SWAP"',
    description: 'Swap space configuration',
  },
];

// ── SSH Client class ──────────────────────────────────────────────────────────

export interface SSHClientOptions {
  host: string;
  port?: number;
  username: string;
  password: string;
  timeout?: number;
  commandTimeout?: number;
}

export class SSHAuditClient {
  private client: Client | null = null;
  private connected = false;

  constructor(private readonly opts: SSHClientOptions) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Open an SSH connection to the target host.
   * Returns connection metadata on success; throws SSHConnectionError on failure.
   */
  connect(): Promise<{ host: string; username: string; message: string }> {
    return new Promise((resolve, reject) => {
      const timeoutMs = this.opts.timeout ?? config.sshTimeout;
      const client = new Client();
      let settled = false;

      const settle = (err?: SSHConnectionError) => {
        if (settled) return;
        settled = true;
        if (err) {
          client.destroy();
          reject(err);
        } else {
          resolve({
            host: this.opts.host,
            username: this.opts.username,
            message: `Successfully connected to ${this.opts.host}`,
          });
        }
      };

      // Global timeout guard
      const timer = setTimeout(() => {
        settle(
          new SSHConnectionError(
            `Target machine did not respond within ${timeoutMs / 1000} seconds.`,
            'timeout',
          ),
        );
      }, timeoutMs);

      client.on('ready', () => {
        clearTimeout(timer);
        this.client = client;
        this.connected = true;
        logger.info(`SSH connected to ${this.opts.username}@${this.opts.host}`);
        settle();
      });

      client.on('error', (err: Error & { code?: string; level?: string }) => {
        clearTimeout(timer);
        const mapped = this._mapError(err);
        logger.warn(`SSH error for ${this.opts.host}: ${err.message} (type=${mapped.errorType})`);
        this.connected = false;
        this.client = null;
        settle(mapped);
      });

      client.on('close', () => {
        this.connected = false;
        this.client = null;
      });

      const connectConfig: ConnectConfig = {
        host: this.opts.host,
        port: this.opts.port ?? 22,
        username: this.opts.username,
        password: this.opts.password,
        readyTimeout: timeoutMs,
        timeout: timeoutMs,
        algorithms: {
          kex: [
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
          ],
        },
      };

      try {
        client.connect(connectConfig);
      } catch (err) {
        clearTimeout(timer);
        settle(new SSHConnectionError(`Failed to initiate SSH connection: ${err}`, 'unknown_error'));
      }
    });
  }

  /**
   * Close the SSH connection gracefully.
   */
  disconnect(): void {
    if (this.client) {
      try {
        this.client.end();
      } catch {
        this.client.destroy();
      }
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Execute a single command over the active SSH session.
   */
  executeCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        return reject(new SSHConnectionError('Not connected to SSH server.', 'not_connected'));
      }

      const cmdTimeout = this.opts.commandTimeout ?? config.sshCommandTimeout;
      let stdoutBuf = '';
      let stderrBuf = '';

      const timer = setTimeout(() => {
        reject(
          new SSHConnectionError(
            `Command timed out after ${cmdTimeout / 1000}s: ${command.substring(0, 60)}`,
            'command_timeout',
          ),
        );
      }, cmdTimeout);

      this.client!.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          return reject(new SSHConnectionError(`Failed to execute command: ${err.message}`, 'command_error'));
        }

        stream.on('data', (chunk: Buffer) => { stdoutBuf += chunk.toString('utf8'); });
        stream.stderr.on('data', (chunk: Buffer) => { stderrBuf += chunk.toString('utf8'); });

        stream.on('close', (exitCode: number) => {
          clearTimeout(timer);
          resolve({
            stdout: stdoutBuf.trim(),
            stderr: stderrBuf.trim(),
            exitCode: exitCode ?? 0,
          });
        });

        stream.on('error', (streamErr: Error) => {
          clearTimeout(timer);
          reject(new SSHConnectionError(`Stream error: ${streamErr.message}`, 'command_error'));
        });
      });
    });
  }

  /**
   * Run all 16 audit checks and return structured audit data.
   */
  async runAudit(): Promise<AuditData> {
    if (!this.isConnected()) {
      throw new SSHConnectionError('Not connected to SSH server.', 'not_connected');
    }

    const results: Record<string, AuditResult> = {};
    const errors: string[] = [];

    for (const cmd of AUDIT_COMMANDS) {
      try {
        const output = await this.executeCommand(cmd.command);
        results[cmd.key] = {
          description: cmd.description,
          command: cmd.command,
          output: output.stdout || output.stderr || '(empty)',
          exit_code: String(output.exitCode),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${cmd.key}: ${msg}`);
        results[cmd.key] = {
          description: cmd.description,
          command: cmd.command,
          output: `ERROR: ${msg}`,
          exit_code: '-1',
        };
      }
    }

    const serverInfo = this._parseServerInfo(results);

    return {
      host: this.opts.host,
      username: this.opts.username,
      server_info: serverInfo,
      audit_results: results,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _mapError(err: Error & { code?: string; level?: string }): SSHConnectionError {
    const msg = err.message ?? '';
    const code = err.code ?? '';
    const level = err.level ?? '';

    if (level === 'client-authentication' || msg.toLowerCase().includes('auth')) {
      return new SSHConnectionError('Invalid username or password.', 'auth_error');
    }
    if (code === 'ETIMEDOUT' || code === 'ECONNABORTED' || msg.includes('timed out')) {
      return new SSHConnectionError(
        `Target machine did not respond within ${(this.opts.timeout ?? config.sshTimeout) / 1000} seconds.`,
        'timeout',
      );
    }
    if (code === 'ECONNREFUSED') {
      return new SSHConnectionError('SSH service is unavailable on the target (connection refused).', 'connection_refused');
    }
    if (code === 'EHOSTUNREACH' || code === 'ENETUNREACH' || code === 'ENOENT') {
      return new SSHConnectionError('Target host cannot be reached. Check the IP and network.', 'host_unreachable');
    }
    if (code === 'ENOTFOUND') {
      return new SSHConnectionError(`Unable to resolve host "${this.opts.host}". Check the IP/hostname.`, 'host_unreachable');
    }

    return new SSHConnectionError(`Unexpected SSH error: ${msg}`, 'unknown_error');
  }

  private _parseServerInfo(results: Record<string, AuditResult>): ServerInfo {
    const osRelease = results['os_release']?.output ?? '';
    const kernelRaw = results['kernel_info']?.output ?? '';

    let osName = 'Unknown';
    let osVersion = 'Unknown';

    for (const line of osRelease.split('\n')) {
      if (line.startsWith('PRETTY_NAME=')) {
        osName = line.split('=')[1]?.replace(/"/g, '').trim() ?? 'Unknown';
      }
      if (line.startsWith('VERSION_ID=') && osVersion === 'Unknown') {
        osVersion = line.split('=')[1]?.replace(/"/g, '').trim() ?? 'Unknown';
      }
    }

    return { os_name: osName, os_version: osVersion, kernel: kernelRaw };
  }
}
