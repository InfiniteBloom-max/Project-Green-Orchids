// Live infra check for the public /status page. Runs server-side so the
// upstream API URL never has to be exposed to the browser, and so the
// browser-side page can just poll same-origin `/api/status`.
export const dynamic = 'force-dynamic';

async function pingHealthz(apiBase) {
  const start = Date.now();
  try {
    const res = await fetch(`${apiBase}/healthz`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => null);
    return { reachable: true, ok: res.ok, latencyMs, body };
  } catch {
    return { reachable: false, ok: false, latencyMs: Date.now() - start, body: null };
  }
}

export async function GET() {
  const apiBase = process.env.API_UPSTREAM_URL || 'http://localhost:5000';
  const health = await pingHealthz(apiBase);

  const apiStatus = health.reachable ? 'operational' : 'major_outage';
  const dbStatus = !health.reachable ? 'unknown' : health.ok && health.body?.status === 'healthy' ? 'operational' : 'major_outage';

  const components = [
    { key: 'web', name: 'Web application', status: 'operational', latencyMs: 0 },
    { key: 'api', name: 'API server', status: apiStatus, latencyMs: health.latencyMs },
    { key: 'database', name: 'Database', status: dbStatus, latencyMs: health.latencyMs },
  ];

  const overall = components.some((c) => c.status === 'major_outage')
    ? 'major_outage'
    : components.some((c) => c.status === 'unknown')
      ? 'degraded'
      : 'operational';

  return Response.json({ overall, components, checkedAt: new Date().toISOString() });
}
