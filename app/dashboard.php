<?
include("../../private/conect.php");

$patients = $USERS->num_rows('pacientes',"");
$message  = $USERS->num_rows('mensajes_destinatarios',"WHERE destinatario_usuario_id = {$_SESSION['PRO']['id']}");
$response = ["totalPatients"=>$patients,"todayAppointments"=>"Mensajes","newRecords"=>$message,"monthlyGrowth"=>300];


echo json_encode($response)
?>