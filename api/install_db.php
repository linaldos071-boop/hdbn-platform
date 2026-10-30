<?php
/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - SCRIPT DIRETO DE INSTALAÇÃO DO BANCO
 * Execute este script pelo navegador no seu servidor InfiniteFree:
 * http://seusite.epizy.com/api/install_db.php
 * ====================================================================
 */

header("Content-Type: text/html; charset=UTF-8");

$db_host = "sql200.epizy.com";
$db_name = "epiz_12345678_hdbn_db";
$db_user = "epiz_12345678";
$db_pass = "SuaSenhaAqui";

echo "<h2>Instalador do Banco de Dados de Blogs/Notícias — HDBN</h2>";

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

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
    echo "<p style='color:green; font-weight:bold;'>✓ Tabela 'blogs' criada/verificada com sucesso no MySQL!</p>";
} catch (PDOException $e) {
    echo "<p style='color:red; font-weight:bold;'>✗ Erro de conexão ou SQL: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Verifique se alterou as variáveis \$db_host, \$db_name, \$db_user e \$db_pass em api/install_db.php com as credenciais do seu painel cPanel do InfiniteFree.</p>";
}
