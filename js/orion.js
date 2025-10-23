const config = {
            apiUrl: 'app/', // Cambia esta URL por la de tu backend
            endpoints: {
                login: 'login.php',
                dashboard: 'dashboard.php',
                patients: 'patients.php',
                appointments: 'appointments.php',
                medicalRecords: 'medical-records.php',
                reports: 'reports.php',
                message: 'message.php',
                settings: 'settings.php',
                profile: 'profile.php'
            }
        };

        // Estado de la aplicación
        let appState = {
            isLoggedIn: false,
            currentUser: null,
            currentPage: 'dashboard',
            token: null
        };

        // Utilidades para mostrar/ocultar spinner
        function showSpinner() {
            gebi('spinner').classList.remove('hidden');
        }

        function hideSpinner() {
            gebi('spinner').classList.add('hidden');
        }

        // Función principal de fetch con manejo de errores
        async function apiRequest(endpoint, options = {}) {
            showSpinner();
            
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            // Agregar token si existe
            if (appState.token) {
                defaultOptions.headers['Authorization'] = `Bearer ${appState.token}`;
            }

            const finalOptions = { ...defaultOptions, ...options };
            
            try {
                const response = await fetch(config.apiUrl + endpoint, finalOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                hideSpinner();
                return data;
                
            } catch (error) {
                hideSpinner();
                console.error('Error en la petición:', error);
                showNotification('Error de conexión', 'danger');
                throw error;
            }
        }

        // Sistema de notificaciones
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

        // Manejo del login
        gebi('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = gebi('email').value;
            const password = gebi('password').value;
            const remember = gebi('remember').checked;
            
            try {
                const response = await apiRequest(config.endpoints.login, {
                    method: 'POST',
                    body: JSON.stringify({ email, password, remember })
                });
                                console.log(response);
                if (response.success) {
                    appState.isLoggedIn = true;
                    appState.currentUser = response.user;
                    appState.token = response.token;
                    
                    // Guardar token si se marcó "recordar"
                    if (remember) {
                        localStorage.setItem('medicalPanelToken', response.token);
                    }
                    
                    showMainPanel();
                    loadPage('dashboard');
                    showNotification('Sesión iniciada correctamente', 'success');
                } else {
                    showNotification(response.message || 'Error en el login', 'danger');
                }
                
            } catch (error) {
                showNotification('Error al iniciar sesión', 'danger');
            }
        });

        // Navegación entre páginas
        function loadPage(pageName) {
            const pageContent = gebi('pageContent');
            const pageTitle = gebi('pageTitle');
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
            
            // Actualizar título
            const titles = {
                dashboard: 'Dashboard',
                patients: 'Gestión de Pacientes',
                appointments: 'Citas Médicas',
                'medical-records': 'Historiales Médicos',
                reports: 'Reportes',
                messages: 'Comunicación',
                settings: 'Configuración',
                profile: 'Mi Perfil'
            };
            
            pageTitle.textContent = titles[pageName] || 'Panel Médico';
            appState.currentPage = pageName;

            // Cerrar navegación móvil
            closeMobileNav();
            
            // Cargar contenido según la página
            switch (pageName) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'patients':
                    loadPatients();
                    break;
                case 'appointments':
                    loadAppointments();
                    break;
                case 'medical-records':
                    loadMedicalRecords();
                    break;
                case 'reports':
                    loadReports();
                    break;
                case 'messages':
                    loadMessages();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                case 'profile':
                    loadProfile();
                    break;
            }
        }

        // Funciones de carga de contenido
        async function loadDashboard() {
            try {
                const data = await apiRequest(config.endpoints.dashboard);
                
                gebi('pageContent').innerHTML = `
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="stats-card p-3">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-people-fill" style="font-size: 2rem;"></i>
                                    <div class="ms-3">
                                        <h4 class="mb-0">${data.totalPatients || 0}</h4>
                                        <small>Pacientes</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stats-card p-3">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-calendar-event-fill" style="font-size: 2rem;"></i>
                                    <div class="ms-3">
                                        <h4 class="mb-0">${data.todayAppointments || 0}</h4>
                                        <small>Citas Hoy</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stats-card p-3">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-file-medical-fill" style="font-size: 2rem;"></i>
                                    <div class="ms-3">
                                        <h4 class="mb-0">${data.newRecords || 0}</h4>
                                        <small>Historiales</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stats-card p-3">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-graph-up" style="font-size: 2rem;"></i>
                                    <div class="ms-3">
                                        <h4 class="mb-0">${data.monthlyGrowth || 0}%</h4>
                                        <small>Crecimiento</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Próximas Citas</h5>
                                </div>
                                <div class="card-body">
                                    <div id="appointmentsList">
                                        <!-- Aquí se cargarán las citas -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Pacientes Recientes</h5>
                                </div>
                                <div class="card-body">
                                    <div id="recentPatients">
                                        <!-- Aquí se cargarán los pacientes recientes -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
            } catch (error) {
                gebi('pageContent').innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo cargar el dashboard. Por favor, intenta de nuevo.
                    </div>
                `;
            }
        }

        async function loadPatients() {
            try {
                const data = await apiRequest(config.endpoints.patients);
              
                let patientsHtml = `
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4>Lista de Pacientes</h4>
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="showAddPatientModal()">
                                <i class="bi bi-plus-circle me-2"></i>Nuevo Paciente
                            </button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Teléfono</th>
                                            <th>Última Visita</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;
                if (data.patients && data.patients.length > 0) {
                    data.patients.forEach(patient => {
                        patientsHtml += `
                            <tr>
                                <td>${patient.name}</td>
                                <td>${patient.email}</td>
                                <td>${patient.phone}</td>
                                <td>${patient.lastVisit}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="viewPatient(${patient.id})">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="editPatient(${patient.id})">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    patientsHtml += `
                        <tr>
                            <td colspan="5" class="text-center">No hay pacientes registrados</td>
                        </tr>
                    `;
                }
                
                patientsHtml += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                
                gebi('pageContent').innerHTML = patientsHtml;
                
            } catch (error) {
                gebi('pageContent').innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo cargar la lista de pacientes.
                    </div>
                `;
            }
        }

        async function loadAppointments() {
            gebi('pageContent').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Gestión de Citas</h4>
                    <button class="btn btn-primary">
                        <i class="bi bi-plus-circle me-2"></i>Nueva Cita
                    </button>
                </div>
                <div class="card">
                    <div class="card-body">
                        <p>Funcionalidad de citas en desarrollo...</p>
                    </div>
                </div>
            `;
        }

        async function loadMedicalRecords() {
            gebi('pageContent').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Historiales Médicos</h4>
                    <button class="btn btn-primary">
                        <i class="bi bi-plus-circle me-2"></i>Nuevo Historial
                    </button>
                </div>
                <div class="card">
                    <div class="card-body">
                        <p>Funcionalidad de historiales en desarrollo...</p>
                    </div>
                </div>
            `;
        }

        async function loadReports() {
            gebi('pageContent').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4>Reportes y Estadísticas</h4>
                    <button class="btn btn-primary">
                        <i class="bi bi-download me-2"></i>Exportar
                    </button>
                </div>
                <div class="card">
                    <div class="card-body">
                        <p>Funcionalidad de reportes en desarrollo...</p>
                    </div>
                </div>
            `;
        }

        async function loadSettings() {
            gebi('pageContent').innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5>Configuración General</h5>
                            </div>
                            <div class="card-body">
                                <p>Funcionalidad de configuración en desarrollo...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        async function loadProfile() {
            try {
                const data = await apiRequest(config.endpoints.profile + '?action=view');
                const t = data.terapeuta;
                
                gebi('pageContent').innerHTML = `
                    <div class="row">
                        <div class="col-md-4 mb-4">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div class="mb-3">
                                        <i class="bi bi-person-circle" style="font-size: 5rem; color: #667eea;"></i>
                                    </div>
                                    <h4>${t.nombre} ${t.apellido}</h4>
                                    <p class="text-muted">${t.terapia_nombre}</p>
                                    <p class="small text-muted mb-0"><i class="bi bi-calendar-check me-2"></i>Ingreso: ${t.fecha_ingreso_formateada}</p>
                                    <p class="small"><strong>Código:</strong> ${t.codigo}</p>
                                    <div class="mt-3">
                                        <span class="badge ${t.activo === 'si' ? 'bg-success' : 'bg-secondary'}">${t.activo === 'si' ? 'Activo' : 'Inactivo'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mt-3">
                                <div class="card-header">
                                    <h6 class="mb-0"><i class="bi bi-shield-check me-2"></i>Seguridad</h6>
                                </div>
                                <div class="card-body">
                                    <button class="btn btn-outline-primary w-100" onclick="showChangePasswordModal()">
                                        <i class="bi bi-key me-2"></i>Cambiar Contraseña
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-8">
                            <div class="card mb-4">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0"><i class="bi bi-person-lines-fill me-2"></i>Datos Personales</h5>
                                    <button class="btn btn-sm btn-primary" onclick="enableEditProfile()">
                                        <i class="bi bi-pencil me-2"></i>Editar
                                    </button>
                                </div>
                                <div class="card-body">
                                    <form id="profileForm">
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Nombre</label>
                                                <input type="text" class="form-control" id="nombre" value="${t.nombre}" disabled>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Apellido</label>
                                                <input type="text" class="form-control" id="apellido" value="${t.apellido}" disabled>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">DNI</label>
                                                <input type="text" class="form-control" value="${t.dni}" disabled>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">CUIT</label>
                                                <input type="text" class="form-control" value="${t.cuit}" disabled>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" value="${t.email}" disabled>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Dirección</label>
                                            <input type="text" class="form-control" id="direccion" value="${t.direccion || ''}" disabled>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Teléfono</label>
                                                <input type="text" class="form-control" id="telefono" value="${t.telefono}" disabled>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Móvil</label>
                                                <input type="text" class="form-control" id="movil" value="${t.movil || ''}" disabled>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Teléfono de Emergencias</label>
                                            <input type="text" class="form-control" id="telefono_emergencias" value="${t.telefono_emergencias || ''}" disabled>
                                            <small class="text-muted">Nombre y teléfono del contacto</small>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Obra Social</label>
                                            <input type="text" class="form-control" id="os" value="${t.os || ''}" disabled>
                                            <small class="text-muted">Obra social y dato de afiliado</small>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">CBU</label>
                                            <input type="text" class="form-control" id="cbu" value="${t.cbu || ''}" disabled>
                                        </div>
                                        
                                        <div id="editButtons" class="d-none mt-4">
                                            <button type="button" class="btn btn-success me-2" onclick="saveProfile()">
                                                <i class="bi bi-check-circle me-2"></i>Guardar Cambios
                                            </button>
                                            <button type="button" class="btn btn-secondary" onclick="cancelEditProfile()">
                                                <i class="bi bi-x-circle me-2"></i>Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-card-checklist me-2"></i>Información Profesional</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Matrícula Nacional</label>
                                            <input type="text" class="form-control" id="matricula_nacional" value="${t.matricula_nacional}" disabled>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Matrícula Provincial</label>
                                            <input type="text" class="form-control" id="matricula_provincial" value="${t.matricula_provincial}" disabled>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Vencimiento Matrícula Provincial</label>
                                        <input type="text" class="form-control" value="${t.matricula_vence_formateada}" disabled>
                                        ${isMatriculaProximaVencer(t.matricula_vence) ? 
                                            '<div class="alert alert-warning mt-2 mb-0"><i class="bi bi-exclamation-triangle me-2"></i>La matrícula está próxima a vencer</div>' : 
                                            ''}
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Terapia</label>
                                        <input type="text" class="form-control" value="${t.terapia_nombre}" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
            } catch (error) {
                gebi('pageContent').innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo cargar el perfil.
                    </div>
                `;
            }
        }

        function isMatriculaProximaVencer(fecha) {
            const vencimiento = new Date(fecha);
            const hoy = new Date();
            const tresMeses = new Date();
            tresMeses.setMonth(tresMeses.getMonth() + 3);
            
            return vencimiento <= tresMeses && vencimiento > hoy;
        }

        function enableEditProfile() {
            // Habilitar campos editables
            const editableFields = ['nombre', 'apellido', 'email', 'direccion', 'telefono', 'movil', 
                                   'telefono_emergencias', 'os', 'cbu', 'matricula_nacional', 'matricula_provincial'];
            
            editableFields.forEach(field => {
                const input = gebi(field);
                if (input) input.disabled = false;
            });
            
            // Mostrar botones de guardar/cancelar
            gebi('editButtons').classList.remove('d-none');
            
            // Ocultar botón editar
            event.target.closest('button').classList.add('d-none');
        }

        function cancelEditProfile() {
            // Recargar perfil para restaurar valores originales
            loadProfile();
        }

        async function saveProfile() {
            const formData = {
                nombre: gebi('nombre').value,
                apellido: gebi('apellido').value,
                email: gebi('email').value,
                direccion: gebi('direccion').value,
                telefono: gebi('telefono').value,
                movil: gebi('movil').value,
                telefono_emergencias: gebi('telefono_emergencias').value,
                os: gebi('os').value,
                cbu: gebi('cbu').value,
                matricula_nacional: gebi('matricula_nacional').value,
                matricula_provincial: gebi('matricula_provincial').value
            };
            
            try {
                const response = await apiRequest(config.endpoints.profile + '?action=update', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                if (response.success) {
                    showNotification('Perfil actualizado correctamente', 'success');
                    loadProfile(); // Recargar para mostrar cambios
                } else {
                    showNotification(response.message || 'Error al actualizar perfil', 'danger');
                }
            } catch (error) {
                showNotification('Error al guardar los cambios', 'danger');
            }
        }

        function showChangePasswordModal() {
            const modalHtml = `
                <div class="modal fade" id="changePasswordModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="bi bi-key me-2"></i>Cambiar Contraseña</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="changePasswordForm">
                                    <div class="mb-3">
                                        <label class="form-label">Contraseña Actual</label>
                                        <input type="password" class="form-control" id="currentPassword" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Nueva Contraseña</label>
                                        <input type="password" class="form-control" id="newPassword" required minlength="6">
                                        <small class="text-muted">Mínimo 6 caracteres</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Confirmar Nueva Contraseña</label>
                                        <input type="password" class="form-control" id="confirmPassword" required minlength="6">
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" onclick="changePassword()">
                                    <i class="bi bi-check-circle me-2"></i>Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Eliminar modal anterior si existe
            const oldModal = document.getElementById('changePasswordModal');
            if (oldModal) oldModal.remove();
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            modal.show();
        }

        async function changePassword() {
            const currentPassword = gebi('currentPassword').value;
            const newPassword = gebi('newPassword').value;
            const confirmPassword = gebi('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Todos los campos son requeridos', 'warning');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('Las contraseñas nuevas no coinciden', 'warning');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }
            
            try {
                const response = await apiRequest(config.endpoints.profile + '?action=change_password', {
                    method: 'POST',
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                
                if (response.success) {
                    showNotification('Contraseña actualizada correctamente', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                    gebi('changePasswordForm').reset();
                } else {
                    showNotification(response.message || 'Error al cambiar contraseña', 'danger');
                }
            } catch (error) {
                showNotification('Error al cambiar la contraseña', 'danger');
            }
        }

        // ==================== MÓDULO DE MENSAJES ====================
        let messageInterval = null;
        let currentMessageView = 'inbox';
        let selectedMessage = null;

        async function loadMessages() {
            try {
                const data = await apiRequest(config.endpoints.message + '?action=list');
                
                gebi('pageContent').innerHTML = `
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="btn-group" role="group">
                                <button class="btn btn-primary" onclick="showInbox()">
                                    <i class="bi bi-inbox-fill me-2"></i>Recibidos
                                    <span id="unreadBadge" class="badge bg-danger ms-2">${data.no_leidos || 0}</span>
                                </button>
                                <button class="btn btn-outline-primary" onclick="showSent()">
                                    <i class="bi bi-send-fill me-2"></i>Enviados
                                </button>
                                <button class="btn btn-success" onclick="showComposeModal()">
                                    <i class="bi bi-plus-circle me-2"></i>Nuevo Mensaje
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0" id="messageListTitle">Mensajes Recibidos</h6>
                                </div>
                                <div class="card-body p-0">
                                    <div id="messageList" class="list-group list-group-flush" style="max-height: 600px; overflow-y: auto;">
                                        <!-- Lista de mensajes -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Detalle del Mensaje</h6>
                                </div>
                                <div class="card-body" id="messageDetail">
                                    <div class="text-center text-muted py-5">
                                        <i class="bi bi-envelope" style="font-size: 3rem;"></i>
                                        <p class="mt-3">Selecciona un mensaje para ver su contenido</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                renderMessageList(data.mensajes, 'inbox');
                startMessagePolling();
                
            } catch (error) {
                gebi('pageContent').innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No se pudo cargar los mensajes.
                    </div>
                `;
            }
        }

        function renderMessageList(mensajes, tipo) {
            const listHtml = mensajes.map(msg => {
                const isUnread = msg.leido === 'no';
                const prioridadClass = msg.prioridad === 'urgente' ? 'border-danger' : 
                                      msg.prioridad === 'alta' ? 'border-warning' : '';
                const prioridadIcon = msg.prioridad === 'urgente' ? '<i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>' : 
                                     msg.prioridad === 'alta' ? '<i class="bi bi-exclamation-circle-fill text-warning me-2"></i>' : '';
                const adjuntoIcon = parseInt(msg.tiene_adjuntos) > 0 ? '<i class="bi bi-paperclip ms-2"></i>' : '';
                
                return `
                    <a href="#" class="list-group-item list-group-item-action ${isUnread ? 'bg-light border-start border-3 border-primary' : ''} ${prioridadClass}" 
                       onclick="viewMessage(${msg.id}, '${tipo}'); return false;">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1 ${isUnread ? 'fw-bold' : ''}">
                                ${prioridadIcon}${msg.asunto}${adjuntoIcon}
                            </h6>
                            <small class="text-muted">${formatDate(msg.fecha_envio)}</small>
                        </div>
                        <p class="mb-1 text-truncate">
                            ${tipo === 'inbox' ? 'De: ' + (msg.remitente_nombre || 'Desconocido') : 'Para: ' + (msg.destinatarios || 'Varios')}
                        </p>
                        <small class="text-muted">${truncateText(msg.mensaje, 60)}</small>
                    </a>
                `;
            }).join('');
            
            gebi('messageList').innerHTML = listHtml || '<div class="p-3 text-center text-muted">No hay mensajes</div>';
        }

        async function showInbox() {
            currentMessageView = 'inbox';
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('btn-primary'));
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.add('btn-outline-primary'));
            event.target.closest('button').classList.remove('btn-outline-primary');
            event.target.closest('button').classList.add('btn-primary');
            
            gebi('messageListTitle').textContent = 'Mensajes Recibidos';
            
            const data = await apiRequest(config.endpoints.message + '?action=list');
            renderMessageList(data.mensajes, 'inbox');
        }

        async function showSent() {
            currentMessageView = 'sent';
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('btn-primary'));
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.add('btn-outline-primary'));
            event.target.closest('button').classList.remove('btn-outline-primary');
            event.target.closest('button').classList.add('btn-primary');
            
            gebi('messageListTitle').textContent = 'Mensajes Enviados';
            
            const data = await apiRequest(config.endpoints.message + '?action=sent');
            renderMessageList(data.mensajes, 'sent');
        }

        async function viewMessage(messageId, tipo) {
            try {
                const data = await apiRequest(config.endpoints.message + `?action=detail&id=${messageId}`);
                const msg = data.mensaje;
                
                selectedMessage = messageId;
                
                const adjuntosHtml = msg.adjuntos && msg.adjuntos.length > 0 ? `
                    <div class="mt-3">
                        <h6>Archivos Adjuntos:</h6>
                        <div class="list-group">
                            ${msg.adjuntos.map(adj => `
                                <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-file-earmark me-2"></i>${adj.nombre_archivo}</span>
                                    <span class="badge bg-secondary">${formatBytes(adj.tamano)}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : '';
                
                const prioridadBadge = msg.prioridad === 'urgente' ? '<span class="badge bg-danger">Urgente</span>' : 
                                      msg.prioridad === 'alta' ? '<span class="badge bg-warning">Alta</span>' : '';
                
                gebi('messageDetail').innerHTML = `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>${msg.asunto} ${prioridadBadge}</h5>
                                <p class="text-muted mb-1">
                                    <strong>${tipo === 'inbox' ? 'De:' : 'Para:'}</strong> 
                                    ${tipo === 'inbox' ? (msg.remitente_nombre || 'Desconocido') : 'Varios destinatarios'}
                                </p>
                                <p class="text-muted small">
                                    <i class="bi bi-calendar me-2"></i>${formatDateTime(msg.fecha_envio)}
                                </p>
                            </div>
                            ${tipo === 'inbox' ? `
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${messageId})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <hr>
                    <div class="message-content" style="white-space: pre-wrap;">
                        ${msg.mensaje}
                    </div>
                    ${adjuntosHtml}
                `;
                
                // Actualizar conteo de no leídos
                updateUnreadCount();
                
            } catch (error) {
                showNotification('Error al cargar el mensaje', 'danger');
            }
        }

        async function showComposeModal() {
            try {
                const contactsData = await apiRequest(config.endpoints.message + '?action=contacts');
                
                const modalHtml = `
                    <div class="modal fade" id="composeModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Nuevo Mensaje</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="composeForm">
                                        <div class="mb-3">
                                            <label class="form-label">Destinatarios</label>
                                            <select class="form-select" id="messageRecipients" multiple size="6">
                                                ${contactsData.sector ? `
                                                    <option value="sector-${contactsData.sector.id}">
                                                        📢 Todo el sector: ${contactsData.sector.nombre}
                                                    </option>
                                                ` : ''}
                                                ${contactsData.contactos.map(c => `
                                                    <option value="${c.tipo}-${c.id}">
                                                        ${c.tipo === 'terapeuta' ? '👤' : '👔'} 
                                                        ${c.nombre || c.first_name} ${c.apellido || c.last_name || ''}
                                                    </option>
                                                `).join('')}
                                            </select>
                                            <small class="text-muted">Mantén presionado Ctrl/Cmd para seleccionar varios</small>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Prioridad</label>
                                            <select class="form-select" id="messagePriority">
                                                <option value="normal">Normal</option>
                                                <option value="alta">Alta</option>
                                                <option value="urgente">Urgente</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Asunto</label>
                                            <input type="text" class="form-control" id="messageSubject" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Mensaje</label>
                                            <textarea class="form-control" id="messageBody" rows="8" required></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn btn-primary" onclick="sendMessage()">
                                        <i class="bi bi-send me-2"></i>Enviar Mensaje
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Eliminar modal anterior si existe
                const oldModal = document.getElementById('composeModal');
                if (oldModal) oldModal.remove();
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                const modal = new bootstrap.Modal(document.getElementById('composeModal'));
                modal.show();
                
            } catch (error) {
                showNotification('Error al cargar contactos', 'danger');
            }
        }

        async function sendMessage() {
            const recipients = Array.from(gebi('messageRecipients').selectedOptions).map(opt => {
                const [tipo, id] = opt.value.split('-');
                return { tipo, id: parseInt(id) };
            });
            
            const asunto = gebi('messageSubject').value.trim();
            const mensaje = gebi('messageBody').value.trim();
            const prioridad = gebi('messagePriority').value;
            
            if (recipients.length === 0 || !asunto || !mensaje) {
                showNotification('Por favor complete todos los campos', 'warning');
                return;
            }
            
            try {
                const response = await apiRequest(config.endpoints.message + '?action=send', {
                    method: 'POST',
                    body: JSON.stringify({
                        destinatarios: recipients,
                        asunto: asunto,
                        mensaje: mensaje,
                        prioridad: prioridad
                    })
                });
                
                if (response.success) {
                    showNotification('Mensaje enviado correctamente', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('composeModal')).hide();
                    
                    // Recargar lista de enviados
                    if (currentMessageView === 'sent') {
                        showSent();
                    }
                } else {
                    showNotification(response.message || 'Error al enviar mensaje', 'danger');
                }
                
            } catch (error) {
                showNotification('Error al enviar mensaje', 'danger');
            }
        }

        async function deleteMessage(messageId) {
            if (!confirm('¿Está seguro de eliminar este mensaje?')) return;
            
            try {
                await apiRequest(config.endpoints.message + `?action=delete&id=${messageId}`);
                showNotification('Mensaje eliminado', 'success');
                
                // Recargar lista
                showInbox();
                
                // Limpiar detalle
                gebi('messageDetail').innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-envelope" style="font-size: 3rem;"></i>
                        <p class="mt-3">Selecciona un mensaje para ver su contenido</p>
                    </div>
                `;
                
            } catch (error) {
                showNotification('Error al eliminar mensaje', 'danger');
            }
        }

        async function updateUnreadCount() {
            try {
                const data = await apiRequest(config.endpoints.message + '?action=unread_count');
                const badge = document.getElementById('unreadBadge');
                if (badge) {
                    badge.textContent = data.count;
                    badge.style.display = data.count > 0 ? 'inline' : 'none';
                }
            } catch (error) {
                console.error('Error al actualizar conteo:', error);
            }
        }

        function startMessagePolling() {
            // Limpiar intervalo anterior
            if (messageInterval) {
                clearInterval(messageInterval);
            }
            
            // Actualizar cada 2 minutos
            messageInterval = setInterval(() => {
                if (appState.currentPage === 'messages') {
                    updateUnreadCount();
                    
                    // Recargar lista actual
                    if (currentMessageView === 'inbox') {
                        apiRequest(config.endpoints.message + '?action=list').then(data => {
                            renderMessageList(data.mensajes, 'inbox');
                        });
                    }
                }
            }, 120000); // 2 minutos
        }

        // Utilidades de formato
        function formatDate(dateString) {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Ayer';
            } else {
                return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        }

        function formatDateTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function formatBytes(bytes) {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        function truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substr(0, maxLength) + '...';
        }

        // Mostrar panel principal
        function showMainPanel() {
            gebi('loginPage').classList.add('hidden');
            gebi('mainPanel').classList.remove('hidden');
            
            if (appState.currentUser) {
                gebi('userNameDisplay').textContent = appState.currentUser.name;
                gebi('userNameDisplayMobile').textContent = appState.currentUser.name;
            }
        }

        // Funciones para navegación móvil
        function openMobileNav() {
            gebi('mobileNav').classList.add('show');
            gebi('mobileNavOverlay').classList.add('show');
        }

        function closeMobileNav() {
            gebi('mobileNav').classList.remove('show');
            gebi('mobileNavOverlay').classList.remove('show');
        }

        // Cerrar sesión
        function logout() {
            // Limpiar intervalo de mensajes
            if (messageInterval) {
                clearInterval(messageInterval);
            }
            
            appState.isLoggedIn = false;
            appState.currentUser = null;
            appState.token = null;
            localStorage.removeItem('medicalPanelToken');
            gebi('mainPanel').classList.add('hidden');
            gebi('loginPage').classList.remove('hidden');
            
            // Limpiar formulario
            gebi('loginForm').reset();
            
            showNotification('Sesión cerrada correctamente', 'info');
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
            // Verificar si hay token guardado
            const savedToken = localStorage.getItem('medicalPanelToken');
            if (savedToken) {
                appState.token = savedToken;
                // Aquí podrías verificar el token con el servidor
                // Por ahora solo mostramos el panel
                showMainPanel();
                loadPage('dashboard');
            }
            
            // Navegación
            document.querySelectorAll('[data-page]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.target.closest('[data-page]').dataset.page;
                    loadPage(page);
                });
            });
             // Botones de navegación móvil
            gebi('mobileMenuBtn').addEventListener('click', openMobileNav);
            gebi('closeMobileNav').addEventListener('click', closeMobileNav);
            gebi('mobileNavOverlay').addEventListener('click', closeMobileNav);
           
            // Logout buttons
            gebi('logoutBtn').addEventListener('click', logout);
            gebi('logoutBtn2').addEventListener('click', logout);
            gebi('logoutBtn3').addEventListener('click', logout);
            gebi('logoutBtn4').addEventListener('click', logout);
        });

        // Funciones auxiliares para las acciones de pacientes
        function showAddPatientModal() {
            showNotification('Modal de nuevo paciente - en desarrollo', 'info');
        }

        function viewPatient(id) {
            showNotification(`Ver paciente ID: ${id} - en desarrollo`, 'info');
        }

        function editPatient(id) {
            showNotification(`Editar paciente ID: ${id} - en desarrollo`, 'info');
        }