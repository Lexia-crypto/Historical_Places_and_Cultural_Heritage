<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$table = resolve_table($_GET['table'] ?? null);
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    respond(400, ['success' => false, 'message' => 'Valid id required.']);
}

$data = get_json();
$payload = normalize_payload($table, $data);

if (!$payload) {
    respond(400, ['success' => false, 'message' => 'No update fields supplied.']);
}

$errors = validate_record($table, $payload, true);
if ($errors) {
    respond(422, ['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
}

try {
    $check = db()->prepare('SELECT id FROM ' . $table . ' WHERE id = :id');
    $check->execute([':id' => $id]);

    if (!$check->fetch()) {
        respond(404, ['success' => false, 'message' => 'Record not found.']);
    }

    $sets = [];
    $params = [':id' => $id];

    foreach ($payload as $column => $value) {
        $sets[] = $column . ' = :' . $column;
        $params[':' . $column] = $value;
    }

    $sql = 'UPDATE ' . $table . ' SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $statement = db()->prepare($sql);
    $statement->execute($params);

    respond(200, ['success' => true, 'message' => 'Record updated.', 'table' => $table]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'message' => 'Database error.']);
}
