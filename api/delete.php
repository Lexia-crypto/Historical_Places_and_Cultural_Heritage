<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$table = resolve_table($_GET['table'] ?? null);
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    respond(400, ['success' => false, 'message' => 'Valid id required.']);
}

try {
    $statement = db()->prepare('DELETE FROM ' . $table . ' WHERE id = :id');
    $statement->execute([':id' => $id]);

    if (!$statement->rowCount()) {
        respond(404, ['success' => false, 'message' => 'Record not found.']);
    }

    respond(200, ['success' => true, 'message' => 'Record deleted.', 'table' => $table]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'message' => 'Database error.']);
}
