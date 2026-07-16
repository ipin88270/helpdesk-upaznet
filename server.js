const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// Enhanced AI Analysis Function
function analyzeComplaint(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // Define complaint patterns with keywords and responses
    const patterns = [
        {
            keywords: ['ganti password', 'password', 'lupa password', 'reset password', 'ubah password', 'password baru'],
            actionKey: 'gantiPass', // Disamakan dengan rawTemplates frontend
            kategori: 'Ganti Password WiFi',
            akarMasalah: 'Pelanggan ingin mengubah atau reset password WiFi router mereka',
            rekomendasi: '1. Login ke admin panel router (biasanya 192.168.1.1 atau 192.168.0.1)\n2. Default username/password cek di stiker modem\n3. Masuk Settings WiFi > Security > ubah password\n4. Simpan perubahan dan test koneksi dengan password baru'
        },
        {
            keywords: ['putus', 'disconnect', 'tidak konek', 'terputus', 'offline', 'down', 'hilang', 'tidak tersambung'],
            actionKey: 'losKabel',
            kategori: 'Koneksi Putus/Offline',
            akarMasalah: 'Sambungan internet terputus atau perangkat offline dari jaringan ISP',
            rekomendasi: '1. Restart modem/ONT tunggu 2-3 menit\n2. Cek status kabel fisik\n3. Periksa indikator LED modem\n4. Jika masih putus, verifikasi di CMS dan escalate ke teknis'
        },
        {
            keywords: ['lemot', 'lambat', 'slow', 'lag', 'delay', 'jelek', 'buruk'],
            actionKey: 'trafficFull',
            kategori: 'Kecepatan Internet Rendah',
            akarMasalah: 'Kecepatan koneksi menurun atau terjadi bottleneck bandwidth',
            rekomendasi: '1. Minta pelanggan test speed di speedtest.net\n2. Periksa CCQ % dan dBm di terminal modem\n3. Cek traffic/trafik penuh atau gangguan RF\n4. Jika masih buruk, lakukan optimize jalur atau ganti perangkat'
        },
        {
            keywords: ['gangguan', 'bts', 'pemancar', 'area', 'masif', 'perbaikan', 'pemeliharaan', 'maintenance'],
            actionKey: 'massPln',
            kategori: 'Gangguan Area/Pemancar',
            akarMasalah: 'Gangguan area luas atau maintenance jaringan pemancar induk',
            rekomendasi: '1. Konfirmasi apakah ada gangguan di area tersebut via system\n2. Beritahu ETA perbaikan\n3. Log complaint di CRM dengan status gangguan area\n4. Follow up setelah gangguan teratasi'
        },
        {
            keywords: ['kabel', 'putus', 'kabel putus', 'loss', 'splice', 'fiber', 'odp', 'odc'],
            actionKey: 'losKabel',
            kategori: 'Indikasi Kabel Putus',
            akarMasalah: 'Kemungkinan besar ada kabel yang putus atau splice rusak di jalur',
            rekomendasi: '1. Cek status COE dan signal loss di modem\n2. Periksa riwayat gangguan area di line tersebut\n3. Koordinasi dengan teknis field untuk survey\n4. Jika terbukti putus, buat WO maintenance kabel'
        },
        {
            keywords: ['hang', 'stuck', 'beku', 'freeze', 'tidak merespon', 'reset', 'restart'],
            actionKey: 'stuck',
            kategori: 'Perangkat Hang/Stuck',
            akarMasalah: 'Perangkat (modem/router) tidak merespon atau hang karena overload/bug',
            rekomendasi: '1. Instruksikan restart perangkat (tahan power 30 detik)\n2. Tunggu booting 2-3 menit\n3. Test koneksi setelah normal\n4. Jika sering hang, ganti perangkat dengan unit baru'
        },
        {
            keywords: ['wifi', 'wireless', 'sinyal', 'putus-putus', 'interference'],
            actionKey: 'interferensi',
            kategori: 'Interferensi/Sinyal WiFi Buruk',
            akarMasalah: 'Sinyal WiFi tersebar tidak merata atau terjadinya interferensi RF lokal',
            rekomendasi: '1. Cek posisi router, jauhkan dari obstacles\n2. Scan channel WiFi dan gunakan channel yang sepi\n3. Ubah frekuensi ke 5GHz jika tersedia\n4. Pertimbangkan penambahan AP/extender jika area luas'
        },
        {
            keywords: ['bayar', 'tagihan', 'pembayaran', 'tunggakan', 'suspend', 'isolir', 'blokir'],
            actionKey: 'financeIsolir',
            kategori: 'Masalah Administrasi/Pembayaran',
            akarMasalah: 'Status pelanggan suspend/isolir akibat pembayaran tertunggak',
            rekomendasi: '1. Cek status pembayaran di billing system\n2. Jika ada tunggakan, minta pembayaran\n3. Proses re-aktif setelah pembayaran terverifikasi\n4. Koordinasi dengan divisi finance jika ada dispute'
        },
        {
            keywords: ['id', 'nama', 'nomor', 'identitas', 'verifikasi', 'data diri', 'nomer'],
            actionKey: 'tanyaId',
            kategori: 'Verifikasi Data Pelanggan',
            akarMasalah: 'Perlu verifikasi identitas pelanggan untuk keamanan dan proses',
            rekomendasi: '1. Minta konfirmasi ID/No. Pelanggan\n2. Validasi nama sesuai database\n3. Jika tidak sesuai, escalate ke supervisor\n4. Lanjutkan proses setelah verifikasi OK'
        }
    ];
    
    // Score each pattern based on keyword matches
    let bestMatch = {
        score: 0,
        actionKey: 'trafficFull',
        kategori: 'Masalah Koneksi Internet',
        akarMasalah: 'Koneksi internet mengalami gangguan atau penurunan kualitas layanan',
        rekomendasi: '1. Restart perangkat modem\n2. Periksa kabel koneksi\n3. Tunggu 2-3 menit untuk stabilisasi\n4. Jika masih bermasalah, hubungi teknis'
    };
    
    patterns.forEach(pattern => {
        let score = 0;
        pattern.keywords.forEach(keyword => {
            if (msg.includes(keyword)) {
                score += 2;
            }
        });
        
        if (score > bestMatch.score) {
            bestMatch = {
                score: score,
                actionKey: pattern.actionKey,
                kategori: pattern.kategori,
                akarMasalah: pattern.akarMasalah,
                rekomendasi: pattern.rekomendasi
            };
        }
    });
    
    return {
        kategori: bestMatch.kategori,
        akar_masalah: bestMatch.akarMasalah, // Menggunakan snake_case sesuai ekspektasi frontend
        rekomendasi: bestMatch.rekomendasi,
        action_key: bestMatch.actionKey
    };
}

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    
    // Handle Groq API endpoint
    if ((parsedUrl.pathname === '/analyze_groq.php' || parsedUrl.pathname === 'analyze_groq.php') && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                
                // API Key Groq Anda
                const apiKey = process.env.GROQ_API_KEY;
                if (!apiKey) throw new Error('GROQ_API_KEY not set');
                
                console.log('Received Groq request:', JSON.stringify(payload, null, 2));
                
                // Call Groq API
                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await groqResponse.json();
                
                console.log('Groq response status:', groqResponse.status);
                
                // If Groq fails or rate limits, use fallback response safely
                if (!groqResponse.ok || responseData.error) {
                    console.log('Using enhanced fallback response due to Groq API error');
                    const rawMsg = payload.messages[1]?.content || '';
                    // Strip the "Analisis chat pelanggan ini: " prefix injected by the frontend
                    const userMessage = rawMsg.replace(/^Analisis chat pelanggan ini:\s*"?/i, '').replace(/"$/, '');
                    
                    const analysis = analyzeComplaint(userMessage);
                    
                    const fallbackResponse = {
                        choices: [{
                            message: {
                                content: JSON.stringify(analysis)
                            }
                        }]
                    };
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(fallbackResponse));
                    return;
                }
                
                res.writeHead(groqResponse.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(responseData));
            } catch (error) {
                console.error('Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // Diagnostics endpoints
    if (parsedUrl.pathname === '/diag/download') {
        const size = parseInt(parsedUrl.searchParams.get('size')) || 5000000;
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': size,
            'Cache-Control': 'no-store'
        });

        const chunk = Buffer.alloc(Math.min(64 * 1024, size), 0);
        let remaining = size;
        while (remaining > 0) {
            const writeSize = Math.min(remaining, chunk.length);
            res.write(chunk.slice(0, writeSize));
            remaining -= writeSize;
        }
        res.end();
        return;
    }

    if (parsedUrl.pathname === '/diag/log' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const entry = JSON.parse(body || '{}');
                fs.appendFile(path.join(__dirname, 'diag_logs.txt'), JSON.stringify({ ts: new Date().toISOString(), entry }) + '\n', (err) => {
                    if (err) console.error('Failed to write diagnostics log', err);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
            }
        });
        return;
    }

    if (parsedUrl.pathname === '/diag/logs') {
        const logPath = path.join(__dirname, 'diag_logs.txt');
        fs.stat(logPath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            fs.createReadStream(logPath).pipe(res);
        });
        return;
    }

    if (parsedUrl.pathname === '/api/ssh' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const { ip, user, pass } = payload;
                if (!ip || !user || !pass) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'Invalid data' }));
                }

                const { exec } = require('child_process');
                const os = require('os');
                const uniqueId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                const vbsPath = path.join(os.tmpdir(), `ssh_auto_${uniqueId}.vbs`);
                
                // VBScript to open CMD, run SSH, wait, and send password
                const vbsScript = `
Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd /k ssh ${user}@${ip}", 1, False
WScript.Sleep 2500
WshShell.SendKeys "${pass}"
WshShell.SendKeys "{ENTER}"
`;
                fs.writeFileSync(vbsPath, vbsScript);
                
                exec(`wscript "${vbsPath}"`, (err) => {
                    // Clean up temp file after script finishes
                    setTimeout(() => {
                        fs.unlink(vbsPath, () => {});
                    }, 8000);
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: error.message }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }

        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.json') contentType = 'application/json';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading file');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});