// ================= PWA APP =================
const APP = {
  sw: null,
  deferredPrompt: null,
  isOnline: 'onLine' in navigator && navigator.onLine,
  isStandalone: false,
  navCount: 0,
  BASE_PATH: '/vite/',

  // ================= INIT =================
  init: function() {
    console.log('APP: Initializing PWA features v6');
    
    // Ensure we're in the right context
    this.ensureCorrectPath();
    
    // Initialize the app
    this.initializeApp();
    
    // Setup service worker
    this.setupServiceWorker();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial UI update
    this.updateUI();
  },
  
  ensureCorrectPath: function() {
    // Only redirect if not on localhost and path doesn't start with base path
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    const isCorrectPath = window.location.pathname.startsWith(this.BASE_PATH);
    
    if (!isLocalhost && !isCorrectPath) {
      const newPath = this.BASE_PATH + window.location.pathname.replace(/^\/+/, '');
      console.log(`Redirecting to ${newPath}`);
      window.location.href = newPath;
      return false;
    }
    return true;
  },
  
  initializeApp: function() {
    // Initialize your app components here
    console.log('Initializing application...');
    
    // Show the app once everything is loaded
    document.addEventListener('DOMContentLoaded', () => {
      const appElement = document.getElementById('q-app');
      if (appElement) {
        appElement.style.display = 'block';
      }
    });
  },
  
  setupServiceWorker: function() {
    // Register service worker
    this.registerSW();
    
    // Check for updates when the app gains focus
    window.addEventListener('focus', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
          .then(reg => {
            if (reg) {
              return reg.update().then(() => {
                console.log('Service Worker update check completed');
              });
            }
          })
          .catch(error => {
            console.error('Service Worker update check failed:', error);
          });
      }
    });
  },
  
  setupEventListeners: function() {
    // Navigation count check
    setTimeout(() => this.checkNavCount(), 10000);
    
    // Network status
    window.addEventListener('online', () => this.changeStatus({ type: 'online' }));
    window.addEventListener('offline', () => this.changeStatus({ type: 'offline' }));
    
    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.gotMessage(event);
      });
    }
  },
  
  updateUI: function() {
    this.changeDisplay();
  },
  },

  // ================= SERVICE WORKER =================
  registerSW: function() {
    if (!('serviceWorker' in navigator)) {
      console.warn('APP: Service Worker not supported');
      return Promise.reject('Service Worker not supported');
    }

    console.log('APP: Registering service worker');

    return new Promise((resolve, reject) => {
      // Register service worker with proper scope for GitHub Pages
      navigator.serviceWorker.register(this.BASE_PATH + 'sw.js', { 
        scope: this.BASE_PATH 
      })
      .then(registration => {
        console.log('APP: Service Worker registered:', registration.scope);
        this.sw = registration.active;
        
        // Wait for service worker to be ready
        return navigator.serviceWorker.ready;
      })
      .then(registration => {
        console.log('APP: Service Worker ready');
        this.sw = registration.active;
        
        // Set up periodic sync if available
        this.setupPeriodicSync(registration);
        
        // Set up background sync if available
        this.setupBackgroundSync(registration);
        
        resolve(registration);
      })
      .catch(err => {
        console.error('APP: Service Worker registration failed:', err);
        reject(err);
      });
    });
  },
  
  setupPeriodicSync: function(registration) {
    if ('periodicSync' in registration && registration.periodicSync) {
      registration.periodicSync.register('periodic-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      })
      .then(() => console.log('APP: Periodic sync registered'))
      .catch(err => console.log('APP: Periodic sync failed:', err));
    }
  },
  
  setupBackgroundSync: function(registration) {
    if ('sync' in registration) {
      registration.sync.register('background-sync')
        .then(() => console.log('APP: Background sync registered'))
        .catch(err => console.log('APP: Background sync failed:', err));
    }
  },
  },

  // ================= EVENT LISTENERS =================
  addListeners: function() {
    // Check PWA launch mode
    if (navigator.standalone) {
      console.log('APP: Launched: Installed (iOS)');
      this.isStandalone = true;
    } else if (matchMedia('(display-mode: standalone)').matches) {
      console.log('APP: Launched: Installed (PWA)');
      this.isStandalone = true;
    } else {
      console.log('APP: Launched: Browser');
      this.isStandalone = false;
    }

    // Network status listeners
    window.addEventListener('pageshow', () => this.updateNavCount());
    window.addEventListener('online', () => this.changeStatus());
    window.addEventListener('offline', () => this.changeStatus());
    navigator.serviceWorker.addEventListener('message', (ev) => this.gotMessage(ev));

    // Install prompt handler
    window.addEventListener('beforeinstallprompt', (ev) => {
      ev.preventDefault();
      this.deferredPrompt = ev;
      console.log('APP: Install prompt deferred');
    });
  },

  // ================= STATUS HANDLERS =================
  changeStatus: function(ev) {
    this.isOnline = ev ? ev.type === 'online' : navigator.onLine;
    console.log('APP: Connection status changed to:', this.isOnline ? 'online' : 'offline');
    this.changeDisplay();
  },

  changeDisplay: function() {
    const onlineElement = document.querySelector('.isonline');

    if (this.isOnline) {
      document.body.classList.remove('offline');
      if (onlineElement) {
        onlineElement.textContent = '';
      }
      console.log('APP: Display - Online mode');
    } else {
      document.body.classList.add('offline');
      if (onlineElement) {
        onlineElement.textContent = ' OFFLINE ';
      }
      console.log('APP: Display - Offline mode');
    }
  },

  // ================= MESSAGE HANDLERS =================
  gotMessage: function(ev) {
    console.log('APP: Message from Service Worker:', ev.data);
    if (ev.data.type === 'CACHE_UPDATED') {
      console.log('APP: Cache updated by service worker');
    }
  },

  sendMessage: function(msg) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
      console.log('APP: Message sent to Service Worker:', msg);
    } else {
      console.log('APP: No active Service Worker to send message to');
    }
  },

  // ================= NAVIGATION =================
  updateNavCount: function(ev) {
    if (!this.isStandalone) {
      let storage = sessionStorage.getItem('moneyballsNavCount');
      this.navCount = storage ? Number(storage) + 1 : 1;
      sessionStorage.setItem('moneyballsNavCount', this.navCount);
      console.log('APP: Navigation count updated:', this.navCount);
    }
  },

  checkNavCount: function() {
    let storage = sessionStorage.getItem('moneyballsNavCount');
    if (storage) {
      this.navCount = Number(storage);
      if (this.navCount > 2) {
        console.log('APP: Showing install prompt (user visited ' + this.navCount + ' times)');
        this.showInstallPrompt();
      }
    }
  },

  // ================= INSTALL PROMPT =================
  showInstallPrompt: function() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          if (window.gtag) {
            window.gtag('event', 'install', {
              'event_category': 'engagement',
              'event_label': 'install_prompt_accepted'
            });
          }
        } else {
          console.log('User dismissed the install prompt');
        }
        this.deferredPrompt = null;
      });
    } else {
      console.log('APP: No install prompt available');
    }
  }
};

// Initialize the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => APP.init());
} else {
  APP.init();
}