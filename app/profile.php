<?php
include("../../private/conect.php");

header('Content-Type: application/json');

// Verificar que el terapeuta está logueado
if (!isset($_SESSION['PRO']['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$terapeuta_id = (int)$_SESSION['PRO']['id'];
$action = $_GET['action'] ?? 'view';

try {
    switch ($action) {
        case 'view':
            // Obtener datos del terapeuta
            $terapeuta = $USERS->full_list('terapeutas', "WHERE id = ?", [$terapeuta_id]);
            
            if (empty($terapeuta)) {
                echo json_encode(['success' => false, 'message' => 'Terapeuta no encontrado']);
                break;
            }
            
            $data = $terapeuta[0];
            
            // Obtener nombre de la terapia si existe
            $terapia_nombre = '';
            if ($data['terapia']) {
                $terapia_info = $USERS->nombre('nombre', 'terapias', "id = ?", [$data['terapia']]);
                $terapia_nombre = $terapia_info ?? 'No especificada';
            }
            
            // Formatear fechas
            $data['fecha_ingreso_formateada'] = $GUSERS->fechaes($data['fecha_ingreso']);
            $data['matricula_vence_formateada'] = $GUSERS->fechaes($data['matricula_vence']);
            $data['terapia_nombre'] = $terapia_nombre;
            
            // No enviar la clave
            unset($data['clave']);
            
            echo json_encode(['success' => true, 'terapeuta' => $data]);
            break;

        case 'update':
            // Actualizar datos del terapeuta
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $campos_permitidos = [
                'nombre', 'apellido', 'email', 'direccion', 
                'telefono', 'movil', 'telefono_emergencias', 'os',
                'cbu', 'matricula_nacional', 'matricula_provincial'
            ];
            
            $updates = [];
            $params = [];
            
            foreach ($campos_permitidos as $campo) {
                if (isset($data[$campo])) {
                    $updates[] = "{$campo} = ?";
                    $params[] = $data[$campo];
                }
            }
            
            if (empty($updates)) {
                echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
                break;
            }
            
            // Agregar el ID al final de los parámetros
            $params[] = $terapeuta_id;
            
            $sql = "UPDATE terapeutas SET " . implode(', ', $updates) . " WHERE id = ?";
            $USERS->run($sql, $params);
            
            // Actualizar sesión
            $_SESSION['PRO'] = $USERS->full_list('terapeutas', "WHERE id = ?", [$terapeuta_id])[0];
            
            echo json_encode(['success' => true, 'message' => 'Datos actualizados correctamente']);
            break;

        case 'change_password':
            // Cambiar contraseña
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            $current_password = $data['current_password'] ?? '';
            $new_password = $data['new_password'] ?? '';
            $confirm_password = $data['confirm_password'] ?? '';
            
            if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
                echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
                break;
            }
            
            if ($new_password !== $confirm_password) {
                echo json_encode(['success' => false, 'message' => 'Las contraseñas nuevas no coinciden']);
                break;
            }
            
            if (strlen($new_password) < 6) {
                echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
                break;
            }
            
            // Verificar contraseña actual
            $terapeuta = $USERS->full_list('terapeutas', "WHERE id = ?", [$terapeuta_id]);
            
            if (!password_verify($current_password, $terapeuta[0]['clave'])) {
                echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta']);
                break;
            }
            
            // Actualizar contraseña
            $nueva_clave_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $USERS->run("UPDATE terapeutas SET clave = ? WHERE id = ?", [$nueva_clave_hash, $terapeuta_id]);
            
            echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
            break;

        case 'terapias':
            // Listar terapias disponibles
            $terapias = $USERS->full_list('terapias', "WHERE activo = 'si'");
            echo json_encode(['success' => true, 'terapias' => $terapias]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}