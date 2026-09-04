/**
 * Lightweight, zero-dependency CookieJar for tracking HTTP-only session cookies
 * across stateful HTTP client requests in test automation.
 */
export class CookieJar {
  private cookies: Map<string, string> = new Map();

  /**
   * Parses Set-Cookie response headers and updates or evicts cookies.
   */
  public extractFromHeaders(headers: Headers): void {
    const rawSetCookie = headers.get('set-cookie');
    if (!rawSetCookie) return;

    // Split cookies on comma boundaries preceding next cookie name
    const cookieStrings = rawSetCookie.split(/,(?=\s*[^;]+=)/g);

    for (const cookieStr of cookieStrings) {
      const trimmed = cookieStr.trim();
      const match = trimmed.match(/^([^=]+)=([^;]*)/);
      if (!match) continue;

      const name = match[1].trim();
      const value = match[2].trim();

      // Check for cookie removal markers (Expires in past or Max-Age=0 or empty value)
      const isExpired =
        value === '' ||
        /Expires=Thu, 01 Jan 1970/i.test(trimmed) ||
        /Max-Age=0/i.test(trimmed);

      if (isExpired) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  /**
   * Generates formatted Cookie header string for HTTP requests.
   */
  public getCookieHeader(): string {
    const pairs: string[] = [];
    for (const [name, value] of this.cookies.entries()) {
      pairs.push(`${name}=${value}`);
    }
    return pairs.join('; ');
  }

  public get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  public set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  public clear(): void {
    this.cookies.clear();
  }
}
