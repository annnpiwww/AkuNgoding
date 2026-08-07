const rateLimits = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  let record = rateLimits.get(ip);
  if (!record) {
    record = { count: 1, lastReset: now };
    rateLimits.set(ip, record);
    return true;
  }
  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}
