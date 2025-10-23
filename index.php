<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Médico - Assitire</title>
    <link rel="apple-touch-icon" sizes="57x57" href="iconos/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="iconos/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="iconos/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="iconos/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="iconos/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="iconos/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="iconos/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="iconos/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="iconos/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="iconos/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="iconos/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="iconos/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="iconos/favicon-16x16.png">
    <link rel="manifest" href="manifest.json">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="iconos/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">    
    <!-- Bootstrap 5.3.2 CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css" rel="stylesheet">
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#0d6efd">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="MedApp">
    
    <!-- Manifest -->
    <link rel="stylesheet" href="style/style.css">
</head>
<body>
    <div id="spinner" class="spinner-overlay hidden">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
    </div>

    <!-- Pantalla de Login -->
    <div id="loginPage" class="login-container d-flex align-items-center justify-content-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="login-card p-4">
                        <div class="text-center mb-4">
                            <img src="images/android-icon-96x96.png" class="img-fluid" alt="Assitire">
                            <h3 class="mt-3 mb-0">ASSISTIRE</h3>
                            <p class="text-muted">Acceso para profesionales</p>
                        </div>
                        
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                    <input type="email" class="form-control" id="email" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Contraseña</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                                    <input type="password" class="form-control" id="password" required>
                                </div>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="remember">
                                <label class="form-check-label" for="remember">
                                    Recordar sesión
                                </label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100 mb-3">
                                <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
                            </button>
                            
                            <div class="text-center">
                                <a href="#" class="text-decoration-none">¿Olvidaste tu contraseña?</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Panel Principal -->
<div id="mainPanel" class="hidden">
        <!-- Header móvil -->
        <div class="mobile-header d-md-none">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <button class="btn btn-link text-white p-0 me-3" id="mobileMenuBtn">
                        <i class="bi bi-list" style="font-size: 1.5rem;"></i>
                    </button>
                    <div class="d-flex align-items-center">
                        <img src="images/android-icon-48x48.png" class="img-fluid" alt="Assitire">
                        <h6 class="mb-0 text-white">ASSISTIRE - Panel Médico</h6>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-link text-white p-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle" style="font-size: 1.5rem;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" data-page="profile">Ver Perfil</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn3">Cerrar Sesión</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Navegación móvil -->
        <div class="mobile-nav" id="mobileNav">
            <div class="p-3">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div class="d-flex align-items-center">
                        <img src="images/android-icon-36x36.png" class="img-fluid me-2" alt="Assitire">
                        <h6 class="mb-0 text-white">ASSISTIRE</h6>
                    </div>
                    <button class="btn btn-link text-white p-0" id="closeMobileNav">
                        <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
                    </button>
                </div>
                
                <nav class="nav flex-column">
                    <a href="#" class="nav-link active mobile-nav-link" data-page="dashboard">
                        <i class="bi bi-speedometer2 me-2"></i>Dashboard
                    </a>
                    <a href="#" class="nav-link mobile-nav-link" data-page="patients">
                        <i class="bi bi-people me-2"></i>Pacientes
                    </a>
                    <a href="#" class="nav-link mobile-nav-link" data-page="appointments">
                        <i class="bi bi-calendar-event me-2"></i>Citas
                    </a>
                    <a href="#" class="nav-link mobile-nav-link" data-page="medical-records">
                        <i class="bi bi-file-medical me-2"></i>Historiales
                    </a>
                    <a href="#" class="nav-link mobile-nav-link" data-page="reports">
                        <i class="bi bi-graph-up me-2"></i>Reportes
                    </a>
                    <a href="#" class="nav-link mobile-nav-link" data-page="messages">
                        <i class="bi bi-inbox-fill me-2"></i>Comunicación
                    </a>
                </nav>
                
                <div class="mt-auto pt-4">
                    <a href="#" class="nav-link link-light" id="logoutBtn">
                        <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
                    </a>
                </div>
            </div>
        </div>

        <!-- Overlay para cerrar navegación móvil -->
        <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>

        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar Desktop -->
                <div class="col-md-3 col-lg-2 p-0 sidebar-desktop">
                    <div class="sidebar p-3">
                        <div class="text-center mb-4">
                        <img src="images/android-icon-72x72.png" class="img-fluid" alt="Assitire">
                        <h5 class="mb-0 text-white">ASSISTIRE - Panel Médico</h5>
                        </div>
                        
                        <nav class="nav flex-column">
                            <a href="#" class="nav-link active desktop-nav-link" data-page="dashboard">
                                <i class="bi bi-speedometer2 me-2"></i>Dashboard
                            </a>
                            <a href="#" class="nav-link desktop-nav-link" data-page="patients">
                                <i class="bi bi-people me-2"></i>Pacientes
                            </a>
                            <a href="#" class="nav-link desktop-nav-link" data-page="appointments">
                                <i class="bi bi-calendar-event me-2"></i>Citas
                            </a>
                            <a href="#" class="nav-link desktop-nav-link" data-page="medical-records">
                                <i class="bi bi-file-medical me-2"></i>Historiales
                            </a>
                            <a href="#" class="nav-link desktop-nav-link" data-page="reports">
                                <i class="bi bi-graph-up me-2"></i>Reportes
                            </a>
                            <a href="#" class="nav-link desktop-nav-link" data-page="messages">
                                <i class="bi bi-inbox-fill me-2"></i>Comunicación
                            </a>
                        </nav>
                        
                        <div class="mt-auto pt-4">
                            <a href="#" class="nav-link" id="logoutBtn2">
                                <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Contenido Principal -->
                <div class="col-md-9 col-lg-10 main-content-mobile">
                    <div class="main-content p-4">
                        <!-- Header Desktop -->
                        <div class="row mb-4 d-none d-md-flex">
                            <div class="col">
                                <h2 id="pageTitle">Bienvenido, <span id="userNameDisplay">Dr. Usuario</span></h2>
                            </div>
                            <div class="col-auto">
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-person-circle me-2"></i>Mi Perfil
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" data-page="profile">Ver Perfil</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item" href="#" id="logoutBtn4">Cerrar Sesión</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Título móvil -->
                        <div class="row mb-4 d-md-none">
                            <div class="col">
                                <h4 id="pageTitleMobile">Bienvenido, <span id="userNameDisplayMobile">Dr. Usuario</span></h4>
                            </div>
                        </div>
                        
                        <!-- Contenido Dinámico -->
                        <div id="pageContent">
                            <!-- El contenido se carga aquí dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Bootstrap JS <script src="js/app.js"></script>-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    
    <script src="js/app.js"></script>
    <script src="js/orion.js"></script>
    
</body>
</html>