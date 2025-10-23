// JavaScript Document
// Service Worker for MedApp PWA
const CACHE_NAME = 'medapp-v1.0.3';
const STATIC_CACHE_NAME = 'medapp-static-v1.0.3';
const DYNAMIC_CACHE_NAME = 'medapp-dynamic-v1.0.3';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.php',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
    // Add your custom CSS/JS files here
];

// Files to cache on demand
const DYNAMIC_FILES = [
    '/app/patients',
    '/app/appointments',
    '/app/medical-records',
    '/app/prescriptions',
    '/app/reports'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('SW: Installing Service Worker');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('SW: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('SW: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('SW: Activating Service Worker');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('SW: Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        event.respondWith(handleApiRequest(request));
    }
});

// Handle GET requests with cache-first strategy
async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    try {
        // For static files, try cache first
        if (isStaticFile(request)) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        }
        
        // For API requests, try network first, then cache
        if (isApiRequest(request)) {
            return await networkFirstStrategy(request);
        }
        
        // For other requests, try cache first, then network
        return await cacheFirstStrategy(request);
        
    } catch (error) {
        console.error('SW: Error handling GET request:', error);
        return await handleOfflineRequest(request);
    }
}

// Handle API requests (POST, PUT, DELETE)
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // If successful, cache the response for GET requests
            if (request.method === 'GET') {
                const cache = await caches.open(DYNAMIC_CACHE_NAME);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }
        
        throw new Error(`Network error: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('SW: API request failed, handling offline:', error);
        
        // For offline API requests, store in IndexedDB for later sync
        if (request.method !== 'GET') {
            await storeOfflineRequest(request);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    offline: true, 
                    message: 'Solicitud guardada para sincronizar cuando esté online' 
                }),
                {
                    status: 202,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // For GET requests, try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return await handleOfflineRequest(request);
    }
}

// Cache-first strategy
async function cacheFirstStrategy(request) {
    // ⚠️ Ignorar peticiones no cacheables (como chrome-extension://)
    if (!request.url.startsWith('http')) {
        return fetch(request); // o simplemente: return;
    }

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return await handleOfflineRequest(request);
    }
}

// Network-first strategy
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Check if request is for static files
function isStaticFile(request) {
    const url = new URL(request.url);
    return url.pathname.endsWith('.css') || 
           url.pathname.endsWith('.js') || 
           url.pathname.endsWith('.html') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.jpg') ||
           url.pathname.endsWith('.svg') ||
           url.pathname.endsWith('.ico');
}

// Check if request is for API
function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

// Handle offline requests
async function handleOfflineRequest(request) {
    const url = new URL(request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        const cachedResponse = await caches.match('/');
        if (cachedResponse) {
            return cachedResponse;
        }
    }
    
    // Return offline JSON for API requests
    if (isApiRequest(request)) {
        return new Response(
            JSON.stringify({
                error: 'Sin conexión',
                offline: true,
                message: 'La aplicación está trabajando sin conexión'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
    
    // Return generic offline response
    return new Response(
        'Sin conexión a internet',
        {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        }
    );
}

// Store offline requests for background sync
async function storeOfflineRequest(request) {
    const requestData = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
        timestamp: Date.now()
    };
    
    // Store in IndexedDB (simplified version)
    if ('indexedDB' in self) {
        try {
            const db = await openDB();
            const tx = db.transaction(['offline-requests'], 'readwrite');
            const store = tx.objectStore('offline-requests');
            await store.add(requestData);
            console.log('SW: Offline request stored for sync');
        } catch (error) {
            console.error('SW: Error storing offline request:', error);
        }
    }
}

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MedAppOfflineDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offline-requests')) {
                const store = db.createObjectStore('offline-requests', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

// Background sync
self.addEventListener('sync', event => {
    console.log('SW: Background sync triggered');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineRequests());
    }
});

// Sync offline requests
async function syncOfflineRequests() {
    try {
        const db = await openDB();
        const tx = db.transaction(['offline-requests'], 'readwrite');
        const store = tx.objectStore('offline-requests');
        const requests = await store.getAll();
        
        for (const requestData of requests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                if (response.ok) {
                    await store.delete(requestData.id);
                    console.log('SW: Offline request synced successfully');
                }
            } catch (error) {
                console.error('SW: Error syncing offline request:', error);
            }
        }
        
    } catch (error) {
        console.error('SW: Error during background sync:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Nueva notificación de MedApp',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/icon-view.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icon-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'MedApp', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'data-sync') {
        event.waitUntil(syncAppData());
    }
});

// Sync app data periodically
async function syncAppData() {
    try {
        // Sync patient data
        const patientsResponse = await fetch('/api/patients');
        if (patientsResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put('/api/patients', patientsResponse.clone());
        }
        
        // Sync other data as needed
        console.log('SW: Periodic data sync completed');
        
    } catch (error) {
        console.error('SW: Error during periodic sync:', error);
    }
}

// Handle app updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'UPDATE_APP') {
        // Force update
        self.registration.update();
    }
});

console.log('SW: Service Worker script loaded');