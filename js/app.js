// ================= PWA APP =================
const APP = {
  sw: null,
  deferredPrompt: null,
  isOnline: 'onLine' in navigator && navigator.onLine,
  isStandalone: false,
  navCount: 0,

  // ================= INIT =================
  init: () => {
    console.log('APP: Initializing PWA features v3');
    APP.registerSW();
    APP.addListeners();
    setTimeout(APP.checkNavCount, 10000);
    APP.changeDisplay();
  },

  // ================= SERVICE WORKER =================
  registerSW: () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('APP: Service Worker not supported');
      return;
    }

    console.log('APP: Registering service worker');

    // Register service worker with proper scope for GitHub Pages
    // Register service worker with correct path and scope
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('APP: Service Worker registered:', registration.scope);
        APP.sw = registration.active;

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
      APP.sw = reg.active;
    });
  },

  // ================= EVENT LISTENERS =================
  addListeners: () => {
    // Check PWA launch mode
    if (navigator.standalone) {
      console.log('APP: Launched: Installed (iOS)');
      APP.isStandalone = true;
    } else if (matchMedia('(display-mode: standalone)').matches) {
      console.log('APP: Launched: Installed (PWA)');
      APP.isStandalone = true;
    } else {
      console.log('APP: Launched: Browser');
      APP.isStandalone = false;
    }

    // Network status listeners
    window.addEventListener('pageshow', APP.updateNavCount);
    window.addEventListener('online', APP.changeStatus);
    window.addEventListener('offline', APP.changeStatus);
    navigator.serviceWorker.addEventListener('message', APP.gotMessage);

    // Install prompt handler
    window.addEventListener('beforeinstallprompt', (ev) => {
      ev.preventDefault();
      APP.deferredPrompt = ev;
      console.log('APP: Install prompt deferred');
    });
  },

  // ================= STATUS HANDLERS =================
  changeStatus: (ev) => {
    APP.isOnline = ev.type === 'online';
    console.log('APP: Connection status changed to:', APP.isOnline ? 'online' : 'offline');

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STATUS_CHANGE',
        online: APP.isOnline
      });
    }

    APP.changeDisplay();
  },

  changeDisplay: () => {
    const onlineElement = document.querySelector('.isonline');

    if (APP.isOnline) {
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
  gotMessage: (ev) => {
    console.log('APP: Message from Service Worker:', ev.data);

    if (ev.data.type === 'CACHE_UPDATED') {
      console.log('APP: Cache updated by service worker');
    }
  },

  sendMessage: (msg) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
      console.log('APP: Message sent to Service Worker:', msg);
    } else {
      console.log('APP: No active Service Worker to send message to');
    }
  },

  // ================= NAVIGATION =================
  updateNavCount: (ev) => {
    if (!APP.isStandalone) {
      APP.navCount = 0;
      let storage = sessionStorage.getItem('moneyballsNavCount');
      if (storage) {
        APP.navCount = Number(storage) + 1;
      } else {
        APP.navCount = 1;
      }
      sessionStorage.setItem('moneyballsNavCount', APP.navCount);
      console.log('APP: Navigation count updated:', APP.navCount);
    }
  },

  checkNavCount: () => {
    let storage = sessionStorage.getItem('moneyballsNavCount');
    if (storage) {
      APP.navCount = Number(storage);
      if (APP.navCount > 2) {
        console.log('APP: Showing install prompt (user visited ' + APP.navCount + ' times)');

        document.body.addEventListener('click', () => {
          if (APP.deferredPrompt) {
            APP.deferredPrompt.prompt();
            APP.deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('APP: User accepted install prompt');
                APP.deferredPrompt = null;
                sessionStorage.clear();
              } else {
                console.log('APP: User dismissed install prompt');
              }
            });
          } else {
            console.log('APP: No deferred prompt available');
          }
        }, { once: true });
      }
    }
  },

  // ================= INSTALL PROMPT =================
  showInstallPrompt: () => {
    if (APP.deferredPrompt) {
      // Show the install prompt
      APP.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      APP.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          // Optionally, track the installation
          if (window.gtag) {
            window.gtag('event', 'install', {
              'event_category': 'engagement',
              'event_label': 'install_prompt_accepted'
            });
          }
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the saved prompt since it can't be used again
        APP.deferredPrompt = null;
        
        // Hide the install button
        const installButton = document.getElementById('install-button');
        if (installButton) {
          installButton.style.display = 'none';
        }
      });
      console.log('APP: Install prompt not available');
    }
  }
};

// ================= INITIALIZATION =================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', APP.init);
} else {
  APP.init();
}
