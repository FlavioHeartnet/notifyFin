export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((cookies, part) => {
      const [rawName, ...rawValue] = part.trim().split('=');
      if (!rawName || rawValue.length === 0) {
        return cookies;
      }

      try {
        cookies[rawName] = decodeURIComponent(rawValue.join('='));
      } catch {
        cookies[rawName] = rawValue.join('=');
      }
      return cookies;
    }, {});
}
