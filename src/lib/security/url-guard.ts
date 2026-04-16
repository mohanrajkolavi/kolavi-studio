/**
 * SSRF protection for outbound fetch to user-provided URLs.
 *
 * Blocks:
 *  - non http/https protocols (data:, file:, javascript:, ftp:, gopher:, etc.)
 *  - private/reserved IPv4 and IPv6 ranges (RFC 1918, loopback, link-local, CGNAT, multicast, broadcast)
 *  - cloud metadata endpoints (169.254.169.254 and similar)
 *  - well-known hostnames that resolve internally (localhost, *.internal, metadata.google.internal)
 *
 * DNS is resolved with `all: true` so both A and AAAA records are checked, preventing
 * DNS-rebinding where the first resolution looks public and the second points inward.
 */

import { isIP } from "net";
import { lookup } from "dns/promises";

export class SsrfBlockedError extends Error {
  constructor(reason: string, public readonly url: string) {
    super(`SSRF blocked: ${reason}`);
    this.name = "SsrfBlockedError";
  }
}

const BLOCKED_HOSTS = new Set<string>([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_HOST_SUFFIXES = [".internal", ".local", ".localhost"];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return false;

  // 0.0.0.0/8 - "this network"
  if ((n & 0xff000000) === 0x00000000) return true;
  // 10.0.0.0/8 - RFC 1918
  if ((n & 0xff000000) === 0x0a000000) return true;
  // 100.64.0.0/10 - CGNAT
  if ((n & 0xffc00000) === 0x64400000) return true;
  // 127.0.0.0/8 - loopback
  if ((n & 0xff000000) === 0x7f000000) return true;
  // 169.254.0.0/16 - link-local (includes AWS/GCP/Azure metadata 169.254.169.254)
  if ((n & 0xffff0000) === 0xa9fe0000) return true;
  // 172.16.0.0/12 - RFC 1918
  if ((n & 0xfff00000) === 0xac100000) return true;
  // 192.0.0.0/24 - IETF protocol assignments
  if ((n & 0xffffff00) === 0xc0000000) return true;
  // 192.0.2.0/24 - TEST-NET-1
  if ((n & 0xffffff00) === 0xc0000200) return true;
  // 192.168.0.0/16 - RFC 1918
  if ((n & 0xffff0000) === 0xc0a80000) return true;
  // 198.18.0.0/15 - benchmarking
  if ((n & 0xfffe0000) === 0xc6120000) return true;
  // 198.51.100.0/24 - TEST-NET-2
  if ((n & 0xffffff00) === 0xc6336400) return true;
  // 203.0.113.0/24 - TEST-NET-3
  if ((n & 0xffffff00) === 0xcb007100) return true;
  // 224.0.0.0/4 - multicast
  if ((n & 0xf0000000) === 0xe0000000) return true;
  // 240.0.0.0/4 - reserved
  if ((n & 0xf0000000) === 0xf0000000) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0];

  // Unspecified ::
  if (addr === "::") return true;
  // Loopback ::1
  if (addr === "::1") return true;
  // IPv4-mapped ::ffff:x.x.x.x - recheck against IPv4 rules
  if (addr.startsWith("::ffff:")) {
    const v4 = addr.slice("::ffff:".length);
    if (isIP(v4) === 4) return isPrivateIpv4(v4);
    const hexMatch = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(v4);
    if (hexMatch) {
      const hi = parseInt(hexMatch[1], 16);
      const lo = parseInt(hexMatch[2], 16);
      const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateIpv4(dotted);
    }
  }
  // fc00::/7 - unique local
  if (/^f[cd][0-9a-f]{2}:/.test(addr)) return true;
  // fe80::/10 - link-local
  if (/^fe[89ab][0-9a-f]:/.test(addr)) return true;
  // ff00::/8 - multicast
  if (addr.startsWith("ff")) return true;
  // 2001:db8::/32 - documentation
  if (addr.startsWith("2001:db8:")) return true;

  return false;
}

function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return false;
}

function hostnameBlockedByAllowlist(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(h)) return true;
  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (h === suffix.slice(1) || h.endsWith(suffix)) return true;
  }
  return false;
}

/**
 * Parse a URL and fail if it is clearly unsafe on surface checks (protocol, hostname).
 * Does not do DNS resolution. Use `assertSafePublicUrl` for full async checks including DNS.
 */
export function parseSafeUrl(raw: string): URL {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) throw new SsrfBlockedError("empty url", trimmed);
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new SsrfBlockedError("invalid url", trimmed);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new SsrfBlockedError(`disallowed protocol ${u.protocol}`, trimmed);
  }
  const hostname = u.hostname;
  if (!hostname) throw new SsrfBlockedError("missing hostname", trimmed);
  if (hostnameBlockedByAllowlist(hostname)) {
    throw new SsrfBlockedError(`blocked hostname ${hostname}`, trimmed);
  }
  // If the hostname is a literal IP, check it immediately.
  const ipKind = isIP(hostname);
  if (ipKind && isPrivateIp(hostname)) {
    throw new SsrfBlockedError(`private ip literal ${hostname}`, trimmed);
  }
  return u;
}

/**
 * Full safety check: parse + DNS-resolve + check every returned address.
 * Throws SsrfBlockedError on any violation. Returns the parsed URL on success.
 */
export async function assertSafePublicUrl(raw: string): Promise<URL> {
  const u = parseSafeUrl(raw);

  // Literal IPs: parseSafeUrl already validated.
  if (isIP(u.hostname)) return u;

  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(u.hostname, { all: true });
  } catch {
    throw new SsrfBlockedError(`dns lookup failed for ${u.hostname}`, raw);
  }
  if (!addrs || addrs.length === 0) {
    throw new SsrfBlockedError(`no dns records for ${u.hostname}`, raw);
  }
  for (const { address } of addrs) {
    if (isPrivateIp(address)) {
      throw new SsrfBlockedError(
        `hostname ${u.hostname} resolves to private ip ${address}`,
        raw
      );
    }
  }
  return u;
}

/** Convenience: returns true/false instead of throwing. */
export async function isSafePublicUrl(raw: string): Promise<boolean> {
  try {
    await assertSafePublicUrl(raw);
    return true;
  } catch {
    return false;
  }
}
