// Vercel serverless — SSH auto-connect stub
// The SSH feature uses Windows VBScript + child_process and cannot run on Vercel.
// Returns a clear error so the frontend shows a useful message instead of hanging.
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    res.status(501).json({
        ok: false,
        error: 'SSH auto-connect is only available when running the local server.js. On Vercel, use your SSH client directly with the credentials shown in the OLT table.'
    });
}
