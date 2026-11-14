<?php
$_GET['table'] = 'historical_places';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        require __DIR__ . '/record.php';
        return;
    }

    require __DIR__ . '/records.php';
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require __DIR__ . '/create.php';
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    require __DIR__ . '/update.php';
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require __DIR__ . '/delete.php';
    return;
}

require __DIR__ . '/bootstrap.php';
respond(405, ['success' => false, 'message' => 'Method not allowed.']);
