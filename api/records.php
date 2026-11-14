<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$table = resolve_table($_GET['table'] ?? null);

try {
    $rows = fetch_all_records($table);
    respond(200, ['success' => true, 'count' => count($rows), 'table' => $table, 'data' => $rows]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'message' => 'Database error.']);
}
