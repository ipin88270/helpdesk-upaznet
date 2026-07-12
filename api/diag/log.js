// Vercel serverless — diagnostic log capture
// Vercel has no persistent writable filesystem; logs are acknowledged but not stored.
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

    // On Vercel there is no persistent disk. Log to console (visible in Vercel Function Logs).
    try {
        const entry = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        console.log('[diag/log]', JSON.stringify({ ts: new Date().toISOString(), entry }));
    } catch (e) {
        console.warn('[diag/log] parse error', e.message);
    }

    res.status(200).json({ ok: true });
}
