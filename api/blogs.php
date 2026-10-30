<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = "sql200.epizy.com";
$db_name = "epiz_12345678_hdbn_db";
$db_user = "epiz_12345678";
$db_pass = "SuaSenhaAqui";

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    if (isset($_GET['action']) && $_GET['action'] === 'install') {
        echo json_encode(["status" => "error", "message" => "Conexão MySQL falhou: " . $e->getMessage()]);
        exit();
    }
}

$action = $_GET['action'] ?? '';

if ($action === 'install' || ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'install')) {
    try {
        $sql = "CREATE TABLE IF NOT EXISTS blogs (
            id VARCHAR(100) PRIMARY KEY,
            author_id VARCHAR(100) NOT NULL,
            author_name VARCHAR(100) DEFAULT 'Equipe HDBN',
            tag VARCHAR(50) DEFAULT 'Novidade',
            title VARCHAR(255) NOT NULL,
            excerpt TEXT NOT NULL,
            cover_image TEXT DEFAULT NULL,
            youtube_url TEXT DEFAULT NULL,
            content LONGTEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        $pdo->exec($sql);
        echo json_encode(["status" => "success", "message" => "Tabela 'blogs' pronta no InfinityFree!"]);
    } catch (Exception $ex) {
        echo json_encode(["status" => "error", "message" => "Erro na tabela: " . $ex->getMessage()]);
    }
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM blogs ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'POST':
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);

        if (!isset($data['title']) || empty(trim($data['title']))) {
            echo json_encode(["status" => "error", "message" => "O título é obrigatório."]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO blogs (id, author_id, author_name, tag, title, excerpt, cover_image, youtube_url, content, created_at) VALUES (:id, :author_id, :author_name, :tag, :title, :excerpt, :cover_image, :youtube_url, :content, NOW())");
            
            $stmt->execute([
                ':id' => $data['id'] ?? ('news_' . time()),
                ':author_id' => $data['author_id'] ?? 'sys',
                ':author_name' => $data['author_name'] ?? 'Equipe HDBN',
                ':tag' => $data['tag'] ?? 'Novidade',
                ':title' => $data['title'],
                ':excerpt' => $data['excerpt'] ?? substr($data['content'] ?? '', 0, 120),
                ':cover_image' => $data['cover_image'] ?? null,
                ':youtube_url' => $data['youtube_url'] ?? null,
                ':content' => $data['content'] ?? ''
            ]);

            echo json_encode(["status" => "success", "success" => true, "message" => "Artigo publicado no MySQL!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao inserir: " . $e->getMessage()]);
        }
        break;
}
