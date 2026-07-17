// Vercel serverless — Telnet auto-connect stub
// The Telnet feature uses Windows CMD + VBScript and cannot run on Vercel.
// Returns a clear error so the frontend shows a useful message instead of hanging.
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    res.status(501).json({
        ok: false,
        error: 'PuTTY/Telnet auto-connect is only available when running the local server.js. On Vercel, use your PuTTY client directly with the credentials shown in the OLT table.'
    });
}
