<?php
// analyze_groq.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Tangani preflight request untuk CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method tidak diizinkan"]);
    exit;
}

// Ambil payload JSON dari frontend
$inputData = file_get_contents("php://input");

if (empty($inputData)) {
    http_response_code(400);
    echo json_encode(["error" => "Payload kosong"]);
    exit;
}

// AMBIL API KEY SECARA AMAN DARI ENVIRONMENT VARIABLE
// Konfigurasikan ini di server Anda (misal: Apache .htaccess, Nginx fastcgi_param, atau putenv)
$apiKey = getenv('GROQ_API_KEY'); 

// Fallback cadangan yang aman jika variabel lingkungan belum terkonfigurasi (Ganti dengan key Anda secara lokal jika terpaksa, jangan di-commit ke Git)
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "GROQ_API_KEY environment variable is not set."]);
    exit;
}

// Kirim request menggunakan cURL (Server-to-Server bypasses CORS)
$ch = curl_init("https://api.groq.com/openai/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputData);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "cURL Error: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);
http_response_code($httpCode);
echo $response;
?>