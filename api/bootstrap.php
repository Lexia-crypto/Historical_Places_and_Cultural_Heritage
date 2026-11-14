<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function respond(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function get_json(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) respond(400, ['success'=>false,'message'=>'Invalid JSON body.']);
    return $data;
}
function allowed_fields(array $data): array {
    $allowed = ['title','category_id','municipality','barangay','description',
      'historical_significance','cultural_practices','year_period','source_name',
      'source_url','verification_status','image_path'];
    return array_intersect_key($data, array_flip($allowed));
}
function validate_data(array $data, bool $partial=false): array {
    $errors=[];
    if ((!$partial || array_key_exists('title',$data)) && trim((string)($data['title'] ?? ''))==='') {
        $errors['title']='Title is required.';
    }
    if (isset($data['category_id']) && (!filter_var($data['category_id'], FILTER_VALIDATE_INT) || (int)$data['category_id']<1)) {
        $errors['category_id']='Category must be a positive integer.';
    }
    if (isset($data['verification_status']) && !in_array($data['verification_status'],['pending','verified'],true)) {
        $errors['verification_status']='Status must be pending or verified.';
    }
    return $errors;
}
