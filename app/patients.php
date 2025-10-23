<?
include("../../private/conect.php");
$response = [];

$patients = $USERS->listar('id,nombre_completo,dni,nacimiento,telefono,email','pacientes',"");
foreach($patients as $each):
$response['patients'][] = [
    "id"=>$each['id'],
    "name"=>$each['nombre_completo'],
    "email"=>"{$each['email']}",
    "phone"=>"{$each['telefono']}",
    "lastVisit"=>"{$each['nacimiento']}"];
endforeach;

echo json_encode($response)
?>
