<?php
require_once 'bootstrap.php';
if ($_SERVER['REQUEST_METHOD']!=='DELETE') respond(405,['success'=>false,'message'=>'Method not allowed.']);
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if (!$id || $id<1) respond(400,['success'=>false,'message'=>'Valid id required.']);
try {
 $st=db()->prepare('DELETE FROM heritage_records WHERE id=:id'); $st->execute([':id'=>$id]);
 if (!$st->rowCount()) respond(404,['success'=>false,'message'=>'Record not found.']);
 respond(200,['success'=>true,'message'=>'Record deleted.']);
} catch(Throwable $e) { respond(500,['success'=>false,'message'=>'Database error.']); }
