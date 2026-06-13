// ============================================================
// API Proxy — SofaScore (desplegar en Vercel)
// Carpeta: api/sofascore.js  →  URL: https://TU-APP.vercel.app/api/sofascore
// Uso:     /api/sofascore?path=/unique-tournament/11653/season/88493/events/round/1
// Luego pega la URL del proxy en ColoColo Football Center →
// Configuración → "Conexión automática a Sofascore".
// ============================================================

export default async function handler(req, res) {
  try {
    const rawPath = req.query.path;

    if (!rawPath || typeof rawPath !== 'string') {
      return res.status(400).json({
        error: 'Missing path query parameter'
      });
    }

    let path = decodeURIComponent(rawPath);

    path = path.replace(/^https?:\/\/www\.sofascore\.com\/api\/v1/i, '');
    path = path.replace(/^https?:\/\/api\.sofascore\.com\/api\/v1/i, '');
    path = path.replace(/^\/api\/v1/i, '');

    if (!path.startsWith('/')) path = '/' + path;

    const sofaUrl = 'https://www.sofascore.com/api/v1' + path;

    const response = await fetch(sofaUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,es;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'referer': 'https://www.sofascore.com/',
        'origin': 'https://www.sofascore.com',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
      }
    });

    const text = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    if (!response.ok) {
      return res.status(response.status).send(text);
    }

    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch (e) {
      return res.status(200).send(text);
    }
  } catch (err) {
    return res.status(500).json({
      error: String(err && err.message ? err.message : err)
    });
  }
}
