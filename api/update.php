<?php
require_once 'bootstrap.php';
if ($_SERVER['REQUEST_METHOD']!=='PUT') respond(405,['success'=>false,'message'=>'Method not allowed.']);
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if (!$id || $id<1) respond(400,['success'=>false,'message'=>'Valid id required.']);
$data=get_json(); $errors=validate_data($data,true);
if ($errors) respond(422,['success'=>false,'message'=>'Validation failed.','errors'=>$errors]);
$f=allowed_fields($data); if (!$f) respond(400,['success'=>false,'message'=>'No update fields supplied.']);
try {
 $check=db()->prepare('SELECT id FROM heritage_records WHERE id=:id'); $check->execute([':id'=>$id]);
 if (!$check->fetch()) respond(404,['success'=>false,'message'=>'Record not found.']);
 $sets=[]; $params=[':id'=>$id];
 foreach($f as $k=>$v){$sets[]="$k=:$k";$params[':'.$k]=$v;}
 $st=db()->prepare('UPDATE heritage_records SET '.implode(',',$sets).' WHERE id=:id'); $st->execute($params);
 respond(200,['success'=>true,'message'=>'Record updated.']);
} catch(Throwable $e) { respond(500,['success'=>false,'message'=>'Database error.']); }
