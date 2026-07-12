// Vercel serverless — speedtest download payload
export default function handler(req, res) {
    const size = Math.min(parseInt(req.query.size) || 5000000, 20000000); // cap at 20 MB
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200);

    const chunk = Buffer.alloc(Math.min(65536, size), 0);
    let remaining = size;
    while (remaining > 0) {
        const writeSize = Math.min(remaining, chunk.length);
        res.write(chunk.slice(0, writeSize));
        remaining -= writeSize;
    }
    res.end();
}
