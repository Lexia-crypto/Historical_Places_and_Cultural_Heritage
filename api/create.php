<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$table = resolve_table($_GET['table'] ?? null);
$data = get_json();
$payload = normalize_payload($table, $data);

if ($table === 'historical_places' && !isset($payload['verification_status'])) {
    $payload['verification_status'] = 'online_source_based';
}
if ($table === 'cultural_heritage' && !isset($payload['verification_status'])) {
    $payload['verification_status'] = 'online_source_based';
}

$errors = validate_record($table, $payload, false);
if ($errors) {
    respond(422, ['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
}

try {
    $columns = array_keys($payload);
    $placeholders = [];
    $params = [];

    foreach ($columns as $column) {
        $placeholders[] = ':' . $column;
        $params[':' . $column] = $payload[$column];
    }

    $sql = 'INSERT INTO ' . $table . ' (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
    $statement = db()->prepare($sql);
    $statement->execute($params);

    respond(201, ['success' => true, 'message' => 'Record created.', 'table' => $table, 'id' => (int) db()->lastInsertId()]);
} catch (Throwable $e) {
    respond(422, ['success' => false, 'message' => 'Unable to save record. Check required fields and data types.']);
}
