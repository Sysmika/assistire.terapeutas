<?php
include("../../private/conect.php");

// Obtener el contenido del cuerpo del POST
$json = file_get_contents('php://input');

// Convertir el JSON en un array asociativo de PHP
$data = json_decode($json, true);

// Verificar si hubo error de decodificación
if (json_last_error() === JSON_ERROR_NONE) {
    
    $email = $data['email'] ?? null;
    $email 	= filter_var($email, FILTER_SANITIZE_EMAIL);

    $password   = $data['password'] ?? null;
    
    $U_PRO = $USERS->full_list('terapeutas',"WHERE email = '{$email}'");
        if (password_verify($password, $U_PRO[0]['clave'])) {    
            echo json_encode(['success'=>true,'user'=>$email,'token'=> base64_encode($password),'pro_data' => $U_PRO[0]]);
            $_SESSION['PRO'] = $U_PRO[0];
        }else{
    //http_response_code(400);
            echo json_encode(['success'=>false,'user'=>$email,'token'=> base64_encode($password)]);
            
        }
} else {
    // Error al decodificar JSON
    http_response_code(400);
    echo "JSON inválido";
}
?>
