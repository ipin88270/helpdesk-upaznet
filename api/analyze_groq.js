// Vercel serverless function — Groq AI proxy
// Mirrors the behavior of analyze_groq.php and the /analyze_groq.php route in server.js

function analyzeComplaint(userMessage) {
    const msg = userMessage.toLowerCase();
    const patterns = [
        { keywords: ['ganti password', 'password', 'lupa password', 'reset password', 'ubah password', 'password baru'], actionKey: 'gantiPass', kategori: 'Ganti Password WiFi', akarMasalah: 'Pelanggan ingin mengubah atau reset password WiFi router mereka', rekomendasi: '1. Login ke admin panel router (biasanya 192.168.1.1 atau 192.168.0.1)\n2. Default username/password cek di stiker modem\n3. Masuk Settings WiFi > Security > ubah password\n4. Simpan perubahan dan test koneksi dengan password baru' },
        { keywords: ['putus', 'disconnect', 'tidak konek', 'terputus', 'offline', 'down', 'hilang', 'tidak tersambung'], actionKey: 'losKabel', kategori: 'Koneksi Putus/Offline', akarMasalah: 'Sambungan internet terputus atau perangkat offline dari jaringan ISP', rekomendasi: '1. Restart modem/ONT tunggu 2-3 menit\n2. Cek status kabel fisik\n3. Periksa indikator LED modem\n4. Jika masih putus, verifikasi di CMS dan escalate ke teknis' },
        { keywords: ['lemot', 'lambat', 'slow', 'lag', 'delay', 'jelek', 'buruk'], actionKey: 'trafficFull', kategori: 'Kecepatan Internet Rendah', akarMasalah: 'Kecepatan koneksi menurun atau terjadi bottleneck bandwidth', rekomendasi: '1. Minta pelanggan test speed di speedtest.net\n2. Periksa CCQ % dan dBm di terminal modem\n3. Cek traffic/trafik penuh atau gangguan RF\n4. Jika masih buruk, lakukan optimize jalur atau ganti perangkat' },
        { keywords: ['gangguan', 'bts', 'pemancar', 'area', 'masif', 'perbaikan', 'pemeliharaan', 'maintenance'], actionKey: 'massPln', kategori: 'Gangguan Area/Pemancar', akarMasalah: 'Gangguan area luas atau maintenance jaringan pemancar induk', rekomendasi: '1. Konfirmasi apakah ada gangguan di area tersebut via system\n2. Beritahu ETA perbaikan\n3. Log complaint di CRM dengan status gangguan area\n4. Follow up setelah gangguan teratasi' },
        { keywords: ['kabel', 'loss', 'splice', 'fiber', 'odp', 'odc'], actionKey: 'losKabel', kategori: 'Indikasi Kabel Putus', akarMasalah: 'Kemungkinan besar ada kabel yang putus atau splice rusak di jalur', rekomendasi: '1. Cek status COE dan signal loss di modem\n2. Periksa riwayat gangguan area di line tersebut\n3. Koordinasi dengan teknis field untuk survey\n4. Jika terbukti putus, buat WO maintenance kabel' },
        { keywords: ['hang', 'stuck', 'beku', 'freeze', 'tidak merespon', 'reset', 'restart'], actionKey: 'stuck', kategori: 'Perangkat Hang/Stuck', akarMasalah: 'Perangkat (modem/router) tidak merespon atau hang karena overload/bug', rekomendasi: '1. Instruksikan restart perangkat (tahan power 30 detik)\n2. Tunggu booting 2-3 menit\n3. Test koneksi setelah normal\n4. Jika sering hang, ganti perangkat dengan unit baru' },
        { keywords: ['wifi', 'wireless', 'sinyal', 'putus-putus', 'interference'], actionKey: 'interferensi', kategori: 'Interferensi/Sinyal WiFi Buruk', akarMasalah: 'Sinyal WiFi tersebar tidak merata atau terjadinya interferensi RF lokal', rekomendasi: '1. Cek posisi router, jauhkan dari obstacles\n2. Scan channel WiFi dan gunakan channel yang sepi\n3. Ubah frekuensi ke 5GHz jika tersedia\n4. Pertimbangkan penambahan AP/extender jika area luas' },
        { keywords: ['bayar', 'tagihan', 'pembayaran', 'tunggakan', 'suspend', 'isolir', 'blokir'], actionKey: 'financeIsolir', kategori: 'Masalah Administrasi/Pembayaran', akarMasalah: 'Status pelanggan suspend/isolir akibat pembayaran tertunggak', rekomendasi: '1. Cek status pembayaran di billing system\n2. Jika ada tunggakan, minta pembayaran\n3. Proses re-aktif setelah pembayaran terverifikasi\n4. Koordinasi dengan divisi finance jika ada dispute' },
        { keywords: ['id', 'nama', 'nomor', 'identitas', 'verifikasi', 'data diri', 'nomer'], actionKey: 'tanyaId', kategori: 'Verifikasi Data Pelanggan', akarMasalah: 'Perlu verifikasi identitas pelanggan untuk keamanan dan proses', rekomendasi: '1. Minta konfirmasi ID/No. Pelanggan\n2. Validasi nama sesuai database\n3. Jika tidak sesuai, escalate ke supervisor\n4. Lanjutkan proses setelah verifikasi OK' }
    ];

    let best = { score: 0, actionKey: 'trafficFull', kategori: 'Masalah Koneksi Internet', akarMasalah: 'Koneksi internet mengalami gangguan atau penurunan kualitas layanan', rekomendasi: '1. Restart perangkat modem\n2. Periksa kabel koneksi\n3. Tunggu 2-3 menit untuk stabilisasi\n4. Jika masih bermasalah, hubungi teknis' };
    patterns.forEach(p => {
        let score = 0;
        p.keywords.forEach(k => { if (msg.includes(k)) score += 2; });
        if (score > best.score) best = { score, actionKey: p.actionKey, kategori: p.kategori, akarMasalah: p.akarMasalah, rekomendasi: p.rekomendasi };
    });

    return { kategori: best.kategori, akar_masalah: best.akarMasalah, rekomendasi: best.rekomendasi, action_key: best.actionKey };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    let payload;
    try {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Helper: extract clean user message from the prefixed content
    function extractUserMessage(messages) {
        const raw = messages?.[1]?.content || messages?.[0]?.content || '';
        return raw.replace(/^Analisis chat pelanggan ini:\s*"?/i, '').replace(/"$/, '').trim();
    }

    // No API key — use local fallback immediately, do NOT return a 500 error
    if (!apiKey) {
        const analysis = analyzeComplaint(extractUserMessage(payload?.messages));
        res.status(200).json({ choices: [{ message: { content: JSON.stringify(analysis) } }] });
        return;
    }

    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await groqRes.json();

        if (!groqRes.ok || data.error) {
            // Groq error (rate limit, invalid key, etc.) — fall back to local analyzer
            const analysis = analyzeComplaint(extractUserMessage(payload?.messages));
            res.status(200).json({ choices: [{ message: { content: JSON.stringify(analysis) } }] });
            return;
        }

        res.status(groqRes.status).json(data);
    } catch (err) {
        // Network error — use local fallback
        const analysis = analyzeComplaint(extractUserMessage(payload?.messages));
        res.status(200).json({ choices: [{ message: { content: JSON.stringify(analysis) } }] });
    }
}
