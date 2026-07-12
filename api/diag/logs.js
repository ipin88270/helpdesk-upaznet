// Vercel serverless — serve diagnostic logs
// Vercel has no persistent filesystem; returns empty body to avoid breaking the frontend.
export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).end('');
}
