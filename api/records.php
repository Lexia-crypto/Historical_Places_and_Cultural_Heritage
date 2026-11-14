<?php
require_once 'bootstrap.php';
if ($_SERVER['REQUEST_METHOD']!=='GET') respond(405,['success'=>false,'message'=>'Method not allowed.']);
try {
  $sql='SELECT r.*, c.name AS category_name FROM heritage_records r JOIN categories c ON c.id=r.category_id';
  $where=[]; $params=[];
  if (!empty($_GET['q'])) {
    $where[]='(r.title LIKE :q OR r.municipality LIKE :q OR r.barangay LIKE :q OR r.description LIKE :q)';
    $params[':q']='%'.trim($_GET['q']).'%';
  }
  if (!empty($_GET['category_id']) && filter_var($_GET['category_id'],FILTER_VALIDATE_INT)) {
    $where[]='r.category_id=:cat'; $params[':cat']=(int)$_GET['category_id'];
  }
  if ($where) $sql.=' WHERE '.implode(' AND ',$where);
  $sql.=' ORDER BY r.created_at DESC';
  $st=db()->prepare($sql); $st->execute($params); $rows=$st->fetchAll();
  respond(200,['success'=>true,'count'=>count($rows),'data'=>$rows]);
} catch(Throwable $e) { respond(500,['success'=>false,'message'=>'Database error.']); }
