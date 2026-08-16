<?php
$host = 'localhost';
$port = '3307';
$db_name = 'blog_db';
$username = 'root'; // default XAMPP username
$password = '';     // default XAMPP password

try {
    $conn = new PDO("mysql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name, $username, $password);
    // Set charset to utf8mb4 for full unicode support
    $conn->exec("set names utf8mb4");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => "Database connection error: " . $exception->getMessage()]);
    exit();
}
?>
