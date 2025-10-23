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
$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        case 'list':
            // Listar mensajes recibidos
            $mensajes = $USERS->run("
                SELECT 
                    m.id,
                    m.asunto,
                    m.mensaje,
                    m.fecha_envio,
                    m.prioridad,
                    m.remitente_tipo,
                    m.remitente_id,
                    md.leido,
                    md.fecha_lectura,
                    CASE 
                        WHEN m.remitente_tipo = 'terapeuta' THEN t.nombre
                        WHEN m.remitente_tipo = 'admin' THEN mem.first_name
                    END as remitente_nombre,
                    (SELECT COUNT(*) FROM mensajes_adjuntos WHERE mensaje_id = m.id) as tiene_adjuntos
                FROM mensajes_destinatarios md
                INNER JOIN mensajes m ON md.mensaje_id = m.id
                LEFT JOIN terapeutas t ON m.remitente_tipo = 'terapeuta' AND m.remitente_id = t.id
                LEFT JOIN members mem ON m.remitente_tipo = 'admin' AND m.remitente_id = mem.id
                WHERE md.destinatario_usuario_tipo = 'terapeuta'
                    AND md.destinatario_usuario_id = ?
                    AND md.eliminado = 'no'
                ORDER BY m.fecha_envio DESC
                LIMIT 50
            ", [$terapeuta_id]);

            $result = [];
            while ($row = $mensajes->fetch_assoc()) {
                $result[] = $row;
            }

            echo json_encode([
                'success' => true,
                'mensajes' => $result,
                'no_leidos' => count(array_filter($result, fn($m) => $m['leido'] === 'no'))
            ]);
            break;

        case 'sent':
            // Listar mensajes enviados
            $mensajes = $USERS->run("
                SELECT 
                    m.id,
                    m.asunto,
                    m.mensaje,
                    m.fecha_envio,
                    m.prioridad,
                    GROUP_CONCAT(
                        CASE 
                            WHEN md.destinatario_tipo = 'sector' THEN ms.nombre
                            WHEN md.destinatario_usuario_tipo = 'terapeuta' THEN t.nombre
                            WHEN md.destinatario_usuario_tipo = 'admin' THEN mem.first_name
                        END
                        SEPARATOR ', '
                    ) as destinatarios,
                    (SELECT COUNT(*) FROM mensajes_adjuntos WHERE mensaje_id = m.id) as tiene_adjuntos
                FROM mensajes m
                LEFT JOIN mensajes_destinatarios md ON m.id = md.mensaje_id
                LEFT JOIN mensajes_sectores ms ON md.destinatario_sector_id = ms.id
                LEFT JOIN terapeutas t ON md.destinatario_usuario_tipo = 'terapeuta' AND md.destinatario_usuario_id = t.id
                LEFT JOIN members mem ON md.destinatario_usuario_tipo = 'admin' AND md.destinatario_usuario_id = mem.id
                WHERE m.remitente_tipo = 'terapeuta'
                    AND m.remitente_id = ?
                GROUP BY m.id
                ORDER BY m.fecha_envio DESC
                LIMIT 50
            ", [$terapeuta_id]);

            $result = [];
            while ($row = $mensajes->fetch_assoc()) {
                $result[] = $row;
            }

            echo json_encode(['success' => true, 'mensajes' => $result]);
            break;

        case 'detail':
            $mensaje_id = (int)($_GET['id'] ?? 0);
            
            // Obtener detalle del mensaje
            $mensaje = $USERS->run("
                SELECT 
                    m.*,
                    CASE 
                        WHEN m.remitente_tipo = 'terapeuta' THEN t.nombre
                        WHEN m.remitente_tipo = 'admin' THEN mem.first_name
                    END as remitente_nombre,
                    md.leido,
                    md.fecha_lectura
                FROM mensajes m
                LEFT JOIN terapeutas t ON m.remitente_tipo = 'terapeuta' AND m.remitente_id = t.id
                LEFT JOIN members mem ON m.remitente_tipo = 'admin' AND m.remitente_id = mem.id
                LEFT JOIN mensajes_destinatarios md ON m.id = md.mensaje_id 
                    AND md.destinatario_usuario_tipo = 'terapeuta'
                    AND md.destinatario_usuario_id = ?
                WHERE m.id = ?
                LIMIT 1
            ", [$terapeuta_id, $mensaje_id]);

            $detalle = $mensaje->fetch_assoc();

            if (!$detalle) {
                echo json_encode(['success' => false, 'message' => 'Mensaje no encontrado']);
                break;
            }

            // Marcar como leído
            $USERS->run("
                UPDATE mensajes_destinatarios 
                SET leido = 'si', fecha_lectura = NOW()
                WHERE mensaje_id = ? 
                    AND destinatario_usuario_tipo = 'terapeuta'
                    AND destinatario_usuario_id = ?
                    AND leido = 'no'
            ", [$mensaje_id, $terapeuta_id]);

            // Obtener adjuntos
            $adjuntos = $USERS->run("
                SELECT id, nombre_archivo, tamano, tipo_mime, fecha_subida
                FROM mensajes_adjuntos
                WHERE mensaje_id = ?
            ", [$mensaje_id]);

            $lista_adjuntos = [];
            while ($adj = $adjuntos->fetch_assoc()) {
                $lista_adjuntos[] = $adj;
            }

            $detalle['adjuntos'] = $lista_adjuntos;

            echo json_encode(['success' => true, 'mensaje' => $detalle]);
            break;

        case 'contacts':
            // Obtener lista de contactos del sector
            $sector_result = $USERS->run("
                SELECT sector_id 
                FROM mensajes_usuarios_sectores 
                WHERE usuario_tipo = 'terapeuta' 
                    AND usuario_id = ?
                    AND puede_enviar = 'si'
                LIMIT 1
            ", [$terapeuta_id]);

            $sector_data = $sector_result->fetch_assoc();
            $sector_id = $sector_data['sector_id'] ?? null;

            $contactos = [];

            if ($sector_id) {

                // Administradores del sector
                $admins = $USERS->run("
                    SELECT DISTINCT m.id, m.first_name, m.last_name, 'admin' as tipo
                    FROM members m
                    INNER JOIN mensajes_usuarios_sectores mus ON mus.usuario_id = m.id 
                        AND mus.usuario_tipo = 'admin'
                    WHERE mus.sector_id = ?
                        AND mus.puede_recibir = 'si'
                        AND m.active = 1
                    ORDER BY m.first_name, m.last_name
                ", [$sector_id]);

                while ($adm = $admins->fetch_assoc()) {
                    $contactos[] = $adm;
                }
                // Terapeutas del mismo sector
                $terapeutas = $USERS->run("
                    SELECT DISTINCT t.id, t.nombre, t.apellido, 'terapeuta' as tipo
                    FROM terapeutas t
                    INNER JOIN mensajes_usuarios_sectores mus ON mus.usuario_id = t.id 
                        AND mus.usuario_tipo = 'terapeuta'
                    WHERE mus.sector_id = ?
                        AND mus.puede_recibir = 'si'
                        AND t.activo = 'si'
                        AND t.id != ?
                    ORDER BY t.nombre, t.apellido
                ", [$sector_id, $terapeuta_id]);

                while ($ter = $terapeutas->fetch_assoc()) {
                    $contactos[] = $ter;
                }

                // Información del sector
                $sector_info = $USERS->run("
                    SELECT id, nombre, codigo
                    FROM mensajes_sectores
                    WHERE id = ? AND activo = 'si'
                ", [$sector_id])->fetch_assoc();
            }

            echo json_encode([
                'success' => true, 
                'contactos' => $contactos,
                'sector' => $sector_info ?? null
            ]);
            break;

        case 'send':
            // Enviar nuevo mensaje
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);

            $asunto = $data['asunto'] ?? '';
            $mensaje = $data['mensaje'] ?? '';
            $prioridad = $data['prioridad'] ?? 'normal';
            $destinatarios = $data['destinatarios'] ?? [];

            if (empty($asunto) || empty($mensaje) || empty($destinatarios)) {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                break;
            }

            // Verificar permisos de envío
            $permiso = $USERS->run("
                SELECT puede_enviar, puede_adjuntar, sector_id
                FROM mensajes_usuarios_sectores
                WHERE usuario_tipo = 'terapeuta'
                    AND usuario_id = ?
                LIMIT 1
            ", [$terapeuta_id])->fetch_assoc();

            if (!$permiso || $permiso['puede_enviar'] !== 'si') {
                echo json_encode(['success' => false, 'message' => 'No tiene permisos para enviar mensajes']);
                break;
            }

            // Insertar mensaje
            $USERS->run("
                INSERT INTO mensajes (
                    remitente_tipo, 
                    remitente_id, 
                    remitente_sector_id,
                    asunto, 
                    mensaje, 
                    prioridad
                ) VALUES (?, ?, ?, ?, ?, ?)
            ", ['terapeuta', $terapeuta_id, $permiso['sector_id'], $asunto, $mensaje, $prioridad]);

            $mensaje_id = $USERS->lastID();

            // Insertar destinatarios
            foreach ($destinatarios as $dest) {
                $tipo_dest = $dest['tipo'] ?? '';
                $id_dest = (int)($dest['id'] ?? 0);

                if ($tipo_dest === 'sector') {
                    $USERS->run("
                        INSERT INTO mensajes_destinatarios (
                            mensaje_id,
                            destinatario_tipo,
                            destinatario_sector_id
                        ) VALUES (?, 'sector', ?)
                    ", [$mensaje_id, $id_dest]);
                } else {
                    $USERS->run("
                        INSERT INTO mensajes_destinatarios (
                            mensaje_id,
                            destinatario_tipo,
                            destinatario_usuario_tipo,
                            destinatario_usuario_id
                        ) VALUES (?, 'usuario', ?, ?)
                    ", [$mensaje_id, $tipo_dest, $id_dest]);
                }
            }

            echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente', 'id' => $mensaje_id]);
            break;

        case 'delete':
            $mensaje_id = (int)($_GET['id'] ?? 0);

            // Marcar como eliminado
            $USERS->run("
                UPDATE mensajes_destinatarios 
                SET eliminado = 'si'
                WHERE mensaje_id = ? 
                    AND destinatario_usuario_tipo = 'terapeuta'
                    AND destinatario_usuario_id = ?
            ", [$mensaje_id, $terapeuta_id]);

            echo json_encode(['success' => true, 'message' => 'Mensaje eliminado']);
            break;

        case 'unread_count':
            // Contar mensajes no leídos
            $count = $USERS->run("
                SELECT COUNT(*) as total
                FROM mensajes_destinatarios md
                WHERE md.destinatario_usuario_tipo = 'terapeuta'
                    AND md.destinatario_usuario_id = ?
                    AND md.leido = 'no'
                    AND md.eliminado = 'no'
            ", [$terapeuta_id])->fetch_assoc();

            echo json_encode(['success' => true, 'count' => (int)$count['total']]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}