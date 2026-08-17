// Vercel Serverless Function — läuft auf dem Server, NICHT im Browser.
// Der API-Key wird hier sicher aus einer Umgebungsvariable gelesen
// und niemals an den Browser weitergegeben.
//
// Enthält außerdem ein einfaches Rate-Limit pro IP-Adresse (über Upstash
// Redis, siehe README.md), damit ein öffentlich geteilter Link deine
// API-Kosten nicht unbegrenzt hochtreiben kann.

const RATE_LIMIT_PER_DAY = 15; // Anfragen pro IP und Tag — in README anpassbar

async function checkRateLimit(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Kein Rate-Limit-Speicher konfiguriert -> ohne Limit durchlassen.
  if (!url || !token) {
    return { allowed: true, configured: false };
  }

  const today = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:${ip}:${today}`;

  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const incrData = await incrRes.json();
  const count = incrData.result;

  if (count === 1) {
    // Erste Anfrage heute -> Zähler nach 24h automatisch zurücksetzen.
    await fetch(`${url}/expire/${encodeURIComponent(key)}/86400`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  return { allowed: count <= RATE_LIMIT_PER_DAY, configured: true, count };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY ist nicht gesetzt. Siehe README.md.'
    });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  try {
    const rl = await checkRateLimit(ip);
    if (!rl.allowed) {
      return res.status(429).json({
        error: `Tageslimit erreicht (max. ${RATE_LIMIT_PER_DAY} Anfragen pro Person und Tag). Bitte morgen wieder versuchen.`
      });
    }

    const { system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', // ggf. anpassen, siehe docs.claude.com
        max_tokens: 400,
        system,
        messages
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler: ' + err.message });
  }
}
