/**
 * ITSA Backend - Safe Logger & Error Diagnostic Formatter
 * Masks database credentials, connection strings, and sensitive tokens
 * while exposing full diagnostic details (ErrorEvent, AggregateError,
 * network sub-errors, PostgreSQL error fields, and stack traces).
 */

function getSecretPatterns(): RegExp[] {
  const patterns: RegExp[] = [
    // Standard connection strings: postgres://user:pass@host...
    /(postgres(?:ql)?:\/\/[^:]+:)[^@\s]+(@)/gi,
    // Bearer tokens
    /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
    // Explicit password fields in JSON/strings
    /(password(?:_hash)?\s*[:=]\s*['"]?)[^'"\s,;]+/gi,
  ];

  // If DATABASE_URL is set, dynamically extract and mask its password
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      if (parsed.password && parsed.password.length > 0) {
        const escaped = parsed.password.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patterns.push(new RegExp(escaped, 'g'));
      }
    } catch {
      const match = process.env.DATABASE_URL.match(/:([^@:]+)@/);
      if (match && match[1] && match[1].length > 0) {
        const escaped = match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patterns.push(new RegExp(escaped, 'g'));
      }
    }
  }

  // Mask AUTH_SECRET if present
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length > 4) {
    const escaped = process.env.AUTH_SECRET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(new RegExp(escaped, 'g'));
  }

  return patterns;
}

export function sanitizeLogMessage(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str =
    typeof input === 'string'
      ? input
      : typeof input === 'object'
      ? JSON.stringify(input)
      : String(input);

  for (const pattern of getSecretPatterns()) {
    str = str.replace(pattern, (match, p1, p2) => {
      if (p1 && p2) return `${p1}***${p2}`;
      if (p1) return `${p1}***`;
      return '***';
    });
  }

  return str;
}

/**
 * Formats unknown errors (including ErrorEvent, AggregateError, and Postgres errors)
 * into rich diagnostic strings without exposing secrets.
 */
export function formatError(err: unknown, includeStack = true): string {
  if (!err) return 'Unknown error (null or undefined)';
  if (typeof err === 'string') return sanitizeLogMessage(err);

  const raw = err as any;
  // If wrapped in ErrorEvent (standard in WebSocket / Neon Pool)
  const isErrorEvent =
    raw?.constructor?.name === 'ErrorEvent' || ('target' in raw && 'type' in raw);
  const inner = raw?.error || raw?.cause || raw;

  const lines: string[] = [];

  // 1. Error Name / Type
  const errorName = inner?.name || raw?.name || raw?.constructor?.name || 'Error';
  const displayType =
    isErrorEvent && inner !== raw ? `${errorName} (via ErrorEvent)` : errorName;
  lines.push(`  Name:        ${displayType}`);

  // 2. Error Code / Errno / Syscall
  const code = inner?.code || raw?.code || inner?.errno;
  if (code) {
    lines.push(`  Code:        ${code}`);
  }
  const syscall = inner?.syscall || raw?.syscall;
  if (syscall) {
    lines.push(`  Syscall:     ${syscall}`);
  }

  // 3. Network Target Information (Address / Port / Hostname)
  const address = inner?.address || raw?.address;
  const port = inner?.port || raw?.port;
  if (address || port) {
    lines.push(`  Target:      ${address || 'unknown'}:${port || ''}`);
  }
  const hostname = inner?.hostname || raw?.hostname;
  if (hostname) {
    lines.push(`  Hostname:    ${hostname}`);
  }

  // 4. Primary Message
  let message = inner?.message || raw?.message || '';
  if (!message || message.trim() === '') {
    if (code === 'ETIMEDOUT') {
      message =
        'Connection attempt timed out. The database host could not be reached over the network.';
    } else if (code === 'ENETUNREACH') {
      message = 'Network is unreachable.';
    } else if (code === 'ECONNREFUSED') {
      message = 'Connection refused by database host.';
    } else if (code === 'ENOTFOUND') {
      message = 'Database host address lookup failed (DNS failure).';
    } else if (isErrorEvent) {
      message =
        'WebSocket connection error occurred while communicating with database.';
    } else {
      message = 'An error occurred without a top-level message string.';
    }
  }
  lines.push(`  Message:     ${sanitizeLogMessage(message)}`);

  // 5. PostgreSQL Specific Diagnostic Fields
  const pgFields = [
    { label: 'Detail', val: inner?.detail || raw?.detail },
    { label: 'Hint', val: inner?.hint || raw?.hint },
    { label: 'Position', val: inner?.position || raw?.position },
    { label: 'Schema', val: inner?.schema || raw?.schema },
    { label: 'Table', val: inner?.table || raw?.table },
    { label: 'Column', val: inner?.column || raw?.column },
    { label: 'Constraint', val: inner?.constraint || raw?.constraint },
    { label: 'Routine', val: inner?.routine || raw?.routine },
    { label: 'Severity', val: inner?.severity || raw?.severity },
  ];
  for (const field of pgFields) {
    if (field.val) {
      lines.push(`  PG ${field.label}:  ${sanitizeLogMessage(String(field.val))}`);
    }
  }

  // 6. AggregateError Sub-Errors (e.g. multiple connection attempts)
  const subErrors = Array.isArray(inner?.errors)
    ? inner.errors
    : Array.isArray(raw?.errors)
    ? raw.errors
    : null;
  if (subErrors && subErrors.length > 0) {
    lines.push(`  Sub-Errors (${subErrors.length}):`);
    subErrors.forEach((sub: any, idx: number) => {
      const subMsg = sub?.message || sub?.code || String(sub);
      const subCode = sub?.code ? ` [code: ${sub.code}]` : '';
      const subSys = sub?.syscall ? ` [syscall: ${sub.syscall}]` : '';
      const subAddr = sub?.address ? ` [addr: ${sub.address}:${sub?.port || ''}]` : '';
      lines.push(
        `    [${idx + 1}] ${sanitizeLogMessage(subMsg)}${subCode}${subSys}${subAddr}`
      );
    });
  }

  // 7. Stack Trace (when requested or in non-production)
  const isDev = process.env.NODE_ENV !== 'production';
  if ((includeStack || isDev) && (inner?.stack || raw?.stack)) {
    const stack = inner?.stack || raw?.stack;
    lines.push(`  Stack:`);
    const formattedStack = stack
      .split('\n')
      .slice(1)
      .map((l: string) => `    ${l.trim()}`)
      .join('\n');
    lines.push(sanitizeLogMessage(formattedStack));
  }

  return lines.join('\n');
}

function formatArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (
      arg instanceof Error ||
      (arg &&
        typeof arg === 'object' &&
        ('stack' in arg || 'message' in arg || 'error' in arg))
    ) {
      return '\n' + formatError(arg, true);
    }
    return typeof arg === 'string' ? sanitizeLogMessage(arg) : arg;
  });
}

export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(
      `[INFO] [${new Date().toISOString()}] ${sanitizeLogMessage(msg)}`,
      ...formatArgs(args)
    );
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(
      `[WARN] [${new Date().toISOString()}] ${sanitizeLogMessage(msg)}`,
      ...formatArgs(args)
    );
  },
  error: (msg: string, ...args: any[]) => {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${sanitizeLogMessage(msg)}`,
      ...formatArgs(args)
    );
  },
  debug: (msg: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[DEBUG] [${new Date().toISOString()}] ${sanitizeLogMessage(msg)}`,
        ...formatArgs(args)
      );
    }
  },
};
