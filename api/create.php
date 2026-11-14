<?php
require_once 'bootstrap.php';
if ($_SERVER['REQUEST_METHOD']!=='POST') respond(405,['success'=>false,'message'=>'Method not allowed.']);
$data=get_json(); $errors=validate_data($data);
if ($errors) respond(422,['success'=>false,'message'=>'Validation failed.','errors'=>$errors]);
$f=allowed_fields($data);
$defaults=['category_id'=>1,'municipality'=>'','barangay'=>'','description'=>'','historical_significance'=>'','cultural_practices'=>'','year_period'=>'','source_name'=>'','source_url'=>'','verification_status'=>'pending','image_path'=>''];
$f=array_merge($defaults,$f);
try {
 $cols=array_keys($f); $params=[]; foreach($f as $k=>$v) $params[':'.$k]=$v;
 $sql='INSERT INTO heritage_records ('.implode(',',$cols).') VALUES ('.implode(',',array_map(fn($k)=>':'.$k,$cols)).')';
 $st=db()->prepare($sql); $st->execute($params);
 respond(201,['success'=>true,'message'=>'Record created.','id'=>(int)db()->lastInsertId()]);
} catch(PDOException $e) { respond(422,['success'=>false,'message'=>'Unable to save record. Check category and field values.']); }
