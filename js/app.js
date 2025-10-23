        // PWA Installation
        let deferredPrompt;
        function gebi(id){return document.getElementById(id);}
        function gebc(clase){return document.querySelectorAll('.'+clase);}

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button or banner
            const installBtn = document.createElement('button');
            installBtn.className = 'btn btn-success btn-sm position-fixed';
            installBtn.style.top = '10px';
            installBtn.style.left = '10px';
            installBtn.style.zIndex = '9999';
            installBtn.innerHTML = '<i class="bi bi-download me-1"></i>Instalar App';
            installBtn.onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('PWA installed');
                        installBtn.remove();
                    }
                    deferredPrompt = null;
                });
            };
            
            document.body.appendChild(installBtn);
        });

        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/ws.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // Offline detection
        window.addEventListener('online', () => {
            showNotification('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            showNotification('Sin conexión - Trabajando offline', 'warning');
        });

        console.log('MedApp PWA Template loaded successfully!');


