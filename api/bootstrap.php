<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, ['success' => false, 'message' => 'Invalid JSON body.']);
    }

    return $data;
}

function resolve_table(?string $requestedTable): string {
    $table = strtolower(trim((string) ($requestedTable ?? 'historical_places')));
    $allowed = ['historical_places', 'cultural_heritage'];

    if (!in_array($table, $allowed, true)) {
        respond(400, ['success' => false, 'message' => 'Invalid table name. Use historical_places or cultural_heritage.']);
    }

    return $table;
}

function allowed_fields_for(string $table): array {
    if ($table === 'historical_places') {
        return ['name', 'municipality', 'description', 'historical_significance', 'image_url', 'source_reference', 'verification_status'];
    }

    return ['name', 'category', 'municipality', 'description', 'community_practice', 'image_url', 'source_reference', 'verification_status'];
}

function normalize_payload(string $table, array $input): array {
    $allowed = array_flip(allowed_fields_for($table));
    $normalized = [];

    foreach ($input as $key => $value) {
        $key = trim((string) $key);
        if (isset($allowed[$key])) {
            $normalized[$key] = $value;
        }
    }

    return $normalized;
}

function validate_record(string $table, array $data, bool $partial = false): array {
    $errors = [];

    if ((!$partial || array_key_exists('name', $data)) && trim((string) ($data['name'] ?? '')) === '') {
        $errors['name'] = 'Name is required.';
    }

    if ((!$partial || array_key_exists('description', $data)) && trim((string) ($data['description'] ?? '')) === '') {
        $errors['description'] = 'Description is required.';
    }

    if (($table === 'cultural_heritage') && ((!$partial || array_key_exists('category', $data)) && trim((string) ($data['category'] ?? '')) === '')) {
        $errors['category'] = 'Category is required.';
    }

    if ((!$partial || array_key_exists('source_reference', $data)) && trim((string) ($data['source_reference'] ?? '')) === '') {
        $errors['source_reference'] = 'Source reference is required.';
    }

    if (isset($data['verification_status']) && !in_array(trim((string) $data['verification_status']), ['online_source_based'], true)) {
        $errors['verification_status'] = 'verification_status must be online_source_based.';
    }

    if (isset($data['image_url']) && $data['image_url'] !== null && trim((string) $data['image_url']) !== '' && !filter_var($data['image_url'], FILTER_VALIDATE_URL)) {
        $errors['image_url'] = 'image_url must be a valid URL or NULL.';
    }

    return $errors;
}

function fetch_all_records(string $table): array {
    $sql = 'SELECT * FROM ' . $table;
    $params = [];
    $where = [];

    if (!empty($_GET['q'])) {
        $query = trim($_GET['q']);
        $fields = $table === 'historical_places'
            ? ['name', 'municipality', 'description', 'historical_significance', 'source_reference']
            : ['name', 'category', 'municipality', 'description', 'community_practice', 'source_reference'];

        $clauses = [];
        foreach ($fields as $index => $field) {
            $key = ':q_' . $index;
            $clauses[] = $field . ' LIKE ' . $key;
            $params[$key] = '%' . $query . '%';
        }

        $where[] = '(' . implode(' OR ', $clauses) . ')';
    }

    if (!empty($_GET['municipality'])) {
        $where[] = 'municipality = :municipality';
        $params[':municipality'] = $_GET['municipality'];
    }

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY id ASC';

    $statement = db()->prepare($sql);
    $statement->execute($params);

    return $statement->fetchAll();
}
