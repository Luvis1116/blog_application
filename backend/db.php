<?php
// Load environment variables from .env file if it exists
$env_file = __DIR__ . '/../.env';
$env = (file_exists($env_file) && is_readable($env_file)) ? parse_ini_file($env_file) : [];

if ($env === false) {
    $env = [];
}

$host = $env['DB_HOST'] ?? 'localhost';
$port = $env['DB_PORT'] ?? '3307';
$db_name = $env['DB_NAME'] ?? 'blog_db';
$username = $env['DB_USER'] ?? 'root';
$password = $env['DB_PASS'] ?? '';

try {
    $dsn = "mysql:host={$host}" . (!empty($port) ? ";port={$port}" : "") . ";dbname={$db_name}";
    $conn = new PDO($dsn, $username, $password);
    // Set charset to utf8mb4 for full unicode support
    $conn->exec("set names utf8mb4");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => "Database connection error: " . $exception->getMessage()]);
    exit();
}

