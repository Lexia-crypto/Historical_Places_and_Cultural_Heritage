<?php
require_once 'bootstrap.php';
if ($_SERVER['REQUEST_METHOD']!=='GET') respond(405,['success'=>false,'message'=>'Method not allowed.']);
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if (!$id || $id<1) respond(400,['success'=>false,'message'=>'Valid id required.']);
try {
 $st=db()->prepare('SELECT r.*,c.name AS category_name FROM heritage_records r JOIN categories c ON c.id=r.category_id WHERE r.id=:id');
 $st->execute([':id'=>$id]); $row=$st->fetch();
 if (!$row) respond(404,['success'=>false,'message'=>'Record not found.']);
 respond(200,['success'=>true,'data'=>$row]);
} catch(Throwable $e) { respond(500,['success'=>false,'message'=>'Database error.']); }
