<?php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->password)) {
        $query = "SELECT id, username, password FROM user WHERE username = :username LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($data->password, $row['password'])) {
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['username'] = $row['username'];
                echo json_encode(['message' => 'Login successful.', 'username' => $row['username']]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid password.']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Incomplete data.']);
    }

} elseif ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->email) && !empty($data->password)) {
        $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);
        
        try {
            $query = "INSERT INTO user (username, email, password) VALUES (:username, :email, :password)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $data->username);
            $stmt->bindParam(':email', $data->email);
            $stmt->bindParam(':password', $hashed_password);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'User registered successfully.']);
            }
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Registration failed. Username or email might already exist.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Incomplete data.']);
    }

} elseif ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    echo json_encode(['message' => 'Logged out successfully.']);

} elseif ($action === 'check' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'authenticated' => true,
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action or request method.']);
}
?>
