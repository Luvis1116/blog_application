<?php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper function to check auth
function check_auth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
}

// Helper function for likes
function hasUserLiked($conn, $blog_id, $user_id) {
    if (!$user_id) return false;
    $q = "SELECT 1 FROM blog_likes WHERE blog_id = :blog_id AND user_id = :user_id";
    $stmt = $conn->prepare($q);
    $stmt->bindParam(':blog_id', $blog_id);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    return $stmt->rowCount() > 0;
}

if ($action === 'get-all' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $current_user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $author_filter = isset($_GET['author']) ? $_GET['author'] : '';
    $category_filter = isset($_GET['category']) ? $_GET['category'] : '';
    
    $where_clause = [];
    $params = [];
    
    if ($author_filter === 'me' && $current_user_id) {
        $where_clause[] = "b.user_id = :user_id";
        $params[':user_id'] = $current_user_id;
    }
    if (!empty($category_filter) && $category_filter !== 'All') {
        $where_clause[] = "b.category = :category";
        $params[':category'] = $category_filter;
    }
    
    $where_sql = count($where_clause) > 0 ? "WHERE " . implode(" AND ", $where_clause) : "";
    
    $query = "SELECT b.id, b.title, b.category, b.image_url, SUBSTRING(b.content, 1, 200) as excerpt, b.created_at, u.username, b.user_id,
                     (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as likes_count
              FROM blogPost b 
              JOIN user u ON b.user_id = u.id 
              $where_sql
              ORDER BY b.created_at DESC";
              
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    
    $stmt->execute();
    $blogs = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['has_liked'] = hasUserLiked($conn, $row['id'], $current_user_id);
        $blogs[] = $row;
    }
    
    echo json_encode($blogs);

} elseif ($action === 'get-one' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $current_user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        
        $query = "SELECT b.id, b.title, b.category, b.content, b.image_url, b.created_at, u.username, b.user_id,
                         (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as likes_count
                  FROM blogPost b 
                  JOIN user u ON b.user_id = u.id 
                  WHERE b.id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            $row['has_liked'] = hasUserLiked($conn, $row['id'], $current_user_id);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Blog not found.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Blog ID required.']);
    }

} elseif ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    check_auth();
    
    $title = isset($_POST['title']) ? $_POST['title'] : '';
    $category = isset($_POST['category']) ? $_POST['category'] : 'General';
    $content = isset($_POST['content']) ? $_POST['content'] : '';
    
    if (!empty($title) && !empty($content)) {
        $image_url = null;
        
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_tmp = $_FILES['image']['tmp_name'];
            $file_name = time() . '_' . basename($_FILES['image']['name']);
            $file_path = $upload_dir . $file_name;
            
            $file_type = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($file_type, $allowed)) {
                if (move_uploaded_file($file_tmp, $file_path)) {
                    $image_url = 'uploads/' . $file_name;
                }
            }
        }
        
        $query = "INSERT INTO blogPost (title, category, content, image_url, user_id) VALUES (:title, :category, :content, :image_url, :user_id)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':image_url', $image_url);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['message' => 'Blog created successfully.', 'id' => $conn->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create blog.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required.']);
    }

} elseif ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    check_auth();
    
    $id = isset($_POST['id']) ? $_POST['id'] : null;
    $title = isset($_POST['title']) ? $_POST['title'] : '';
    $category = isset($_POST['category']) ? $_POST['category'] : 'General';
    $content = isset($_POST['content']) ? $_POST['content'] : '';
    
    if ($id && !empty($title) && !empty($content)) {
        // Check ownership
        $check_query = "SELECT user_id, image_url FROM blogPost WHERE id = :id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':id', $id);
        $check_stmt->execute();
        $blog = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$blog || $blog['user_id'] != $_SESSION['user_id']) {
            http_response_code(403);
            echo json_encode(['error' => 'Not authorized to edit this blog.']);
            exit();
        }
        
        $image_url = $blog['image_url'];
        
        // Handle file upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_tmp = $_FILES['image']['tmp_name'];
            $file_name = time() . '_' . basename($_FILES['image']['name']);
            $file_path = $upload_dir . $file_name;
            
            $file_type = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($file_type, $allowed)) {
                if (move_uploaded_file($file_tmp, $file_path)) {
                    $image_url = 'uploads/' . $file_name;
                }
            }
        }
        
        $query = "UPDATE blogPost SET title = :title, category = :category, content = :content, image_url = :image_url WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':image_url', $image_url);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Blog updated successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update blog.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data.']);
    }

} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    check_auth();
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->id)) {
        // Verify ownership
        $check_query = "SELECT user_id FROM blogPost WHERE id = :id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':id', $data->id);
        $check_stmt->execute();
        $blog = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($blog && $blog['user_id'] == $_SESSION['user_id']) {
            $query = "DELETE FROM blogPost WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Blog deleted successfully.']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete blog.']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Not authorized to delete this blog.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Blog ID is required.']);
    }

} elseif ($action === 'toggle-like' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    check_auth();
    $data = json_decode(file_get_contents("php://input"));
    
    if (isset($data->toggle_like) && isset($data->blog_id)) {
        $blog_id = $data->blog_id;
        $user_id = $_SESSION['user_id'];
        
        $check_query = "SELECT 1 FROM blog_likes WHERE user_id = :user_id AND blog_id = :blog_id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->bindParam(':blog_id', $blog_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $del_query = "DELETE FROM blog_likes WHERE user_id = :user_id AND blog_id = :blog_id";
            $del_stmt = $conn->prepare($del_query);
            $del_stmt->bindParam(':user_id', $user_id);
            $del_stmt->bindParam(':blog_id', $blog_id);
            $del_stmt->execute();
            echo json_encode(['message' => 'Unliked', 'liked' => false]);
        } else {
            $ins_query = "INSERT INTO blog_likes (user_id, blog_id) VALUES (:user_id, :blog_id)";
            $ins_stmt = $conn->prepare($ins_query);
            $ins_stmt->bindParam(':user_id', $user_id);
            $ins_stmt->bindParam(':blog_id', $blog_id);
            $ins_stmt->execute();
            echo json_encode(['message' => 'Liked', 'liked' => true]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid like data.']);
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action or request method.']);
}

