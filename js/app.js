// ================= PWA APP =================
const APP = {
  sw: null,
  deferredPrompt: null,
  isOnline: 'onLine' in navigator && navigator.onLine,
  isStandalone: false,
  navCount: 0,

  // ================= INIT =================
  init: function() {
    console.log('APP: Initializing PWA features v5');
    
    // Check if we're running in the correct path
    if (!window.location.pathname.startsWith('/vite/') && !window.location.hostname.includes('localhost')) {
      window.location.href = '/vite/' + window.location.pathname.replace(/^\/+/, '');
      return;
    }
    
    this.registerSW();
    this.addListeners();
    setTimeout(() => this.checkNavCount(), 10000);
    this.changeDisplay();
    
    // Check for updates when the app gains focus
    window.addEventListener('focus', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update().then(() => {
              console.log('Service Worker update check completed');
            }).catch(err => {
              console.error('Service Worker update check failed:', err);
            });
          }
        }).catch(error => {
          console.error('Service Worker update failed:', error);
        });
      }
    });
  },

  // ================= SERVICE WORKER =================
  registerSW: function() {
    if (!('serviceWorker' in navigator)) {
      console.warn('APP: Service Worker not supported');
      return;
    }

    console.log('APP: Registering service worker');

    // Register service worker with proper scope for GitHub Pages
    navigator.serviceWorker.register('/vite/sw.js', { scope: '/vite/' })
      .then(registration => {
        console.log('APP: Service Worker registered:', registration.scope);
        this.sw = registration.active;

        // Periodic Sync
        if ('periodicSync' in registration && registration.periodicSync) {
          registration.periodicSync.register('periodic-sync', {
            minInterval: 24 * 60 * 60 * 1000
          }).then(() => {
            console.log('APP: Periodic sync registered');
          }).catch(err => {
            console.log('APP: Periodic sync failed:', err);
          });
        } else if ('sync' in registration) {
          registration.sync.register('background-sync')
            .then(() => console.log('APP: Background sync registered'))
            .catch(err => console.log('APP: Background sync failed:', err));
        } else {
          console.log('APP: No sync support');
        }
      })
      .catch(err => {
        console.warn('APP: SW registration failed:', err);
      });

    navigator.serviceWorker.ready.then(reg => {
      console.log('APP: Service Worker ready');
      this.sw = reg.active;
    });
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