// Each target names the environment variable holding its upstream origin (e.g.
// "https://example.workers.dev"). Values are set in wrangler.toml [vars]; see wrangler.example.toml.
interface HealthTarget {
  originVar: string;
  healthPath: string;
}

const HEALTH_TARGETS: Record<string, HealthTarget> = {
  myhippo: { originVar: 'MYHIPPO_ORIGIN', healthPath: '/api/health' },
  moneybags: { originVar: 'MONEYBAGS_ORIGIN', healthPath: '/health' },
  'arr-media-agent': { originVar: 'ARR_MEDIA_AGENT_ORIGIN', healthPath: '/api/health' },
  'poke-sauce': { originVar: 'POKE_SAUCE_ORIGIN', healthPath: '/api/health' },
  'the-news': { originVar: 'THE_NEWS_ORIGIN', healthPath: '/' },
  'marathon-loadout': { originVar: 'MARATHON_LOADOUT_ORIGIN', healthPath: '/api/health' },
};

type Env = Record<string, string | undefined>;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = context.params.project as string;
  const target = HEALTH_TARGETS[slug];

  if (!target) {
    return Response.json(
      { status: 'offline', checkedAt: new Date().toISOString(), error: 'Unknown project' },
      { headers: corsHeaders() }
    );
  }

  // An unset origin is reported as offline rather than failing the request.
  const origin = context.env[target.originVar];
  if (!origin) {
    return Response.json(
      { status: 'offline', checkedAt: new Date().toISOString(), error: 'Upstream not configured' },
      { headers: corsHeaders() }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${origin}${target.healthPath}`, {
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timeout);

    let status: 'online' | 'degraded' | 'offline';
    if (response.ok) {
      status = 'online';
    } else if (response.status === 302 || response.status === 301) {
      // Cloudflare Access redirect means the worker is reachable
      status = 'online';
    } else if (response.status < 500) {
      status = 'degraded';
    } else {
      status = 'offline';
    }

    return Response.json(
      { status, checkedAt: new Date().toISOString() },
      { headers: corsHeaders() }
    );
  } catch {
    return Response.json(
      { status: 'offline', checkedAt: new Date().toISOString() },
      { headers: corsHeaders() }
    );
  }
};

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  };
}
