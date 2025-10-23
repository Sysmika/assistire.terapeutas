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
            gebi('pageContent').innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5>Mi Perfil</h5>
                            </div>
                            <div class="card-body">
                                <p>Funcionalidad de perfil en desarrollo...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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


