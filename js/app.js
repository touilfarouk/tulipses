const APP = {
  sw: null,
  deferredPrompt: null, //used for installing later
  isOnline: 'onLine' in navigator && navigator.onLine,
  isStandalone: false,
  navCount: 0,
  init: () => {
    console.log('APP: Initializing PWA features');
    APP.registerSW();
    APP.addListeners();
    setTimeout(APP.checkNavCount, 10000); //10 seconds after loading check for install
    APP.changeDisplay(); //change display to say online or offline
  },
  registerSW: () => {
    if ('serviceWorker' in navigator) {
      console.log('APP: Registering service worker');
      navigator.serviceWorker.register('/sw.js', { scope: '/vite/' }).then(function (registration) {
        console.log('APP: Service Worker registered successfully:', registration.scope);
        APP.sw = registration.active;

        // Check for periodic sync support
        if ('periodicSync' in registration) {
          console.log('APP: Periodic sync supported');
          registration.periodicSync.register('sync-database', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          }).then(() => {
            console.log('APP: Periodic sync registered');
          }).catch(err => {
            console.log('APP: Periodic sync registration failed:', err);
          });
        } else if ('sync' in registration) {
          console.log('APP: Background sync supported');
          registration.sync.register('sync-database').then(() => {
            console.log('APP: Background sync registered');
          }).catch(err => {
            console.log('APP: Background sync registration failed:', err);
          });
        } else {
          console.log('APP: No sync support detected');
        }
      }).catch(function (err) {
        console.warn('APP: Service Worker registration failed:', err);
      });

      navigator.serviceWorker.ready.then((registration) => {
        console.log('APP: Service Worker is ready');
        APP.sw = registration.active;
      });
    } else {
      console.warn('APP: Service Worker not supported');
    }
  },
  addListeners: () => {
    // Check if running as standalone PWA
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
  changeStatus: (ev) => {
    APP.isOnline = ev.type === 'online';
    console.log('APP: Connection status changed to:', APP.isOnline ? 'online' : 'offline');

    // Notify service worker of status change
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ ONLINE: APP.isOnline });
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
  gotMessage: (ev) => {
    console.log('APP: Message from Service Worker:', ev.data);

    // Handle different message types
    if (ev.data.action === 'DB_IMPORTED') {
      console.log('APP: Database imported successfully');
    } else if (ev.data.action === 'DB_RESET_AND_IMPORTED') {
      console.log('APP: Database reset and imported successfully');
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

        // Show install prompt on next user interaction
        document.body.addEventListener('click', () => {
          if (APP.deferredPrompt) {
            APP.deferredPrompt.prompt();
            APP.deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('APP: User accepted the install prompt');
                APP.deferredPrompt = null;
                sessionStorage.clear();
              } else {
                console.log('APP: User dismissed the install prompt');
              }
            });
          } else {
            console.log('APP: No deferred prompt available');
          }
        }, { once: true });
      }
    }
  },
  // Method to manually trigger install prompt
  showInstallPrompt: () => {
    if (APP.deferredPrompt) {
      APP.deferredPrompt.prompt();
      APP.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('APP: User accepted the install prompt');
          APP.deferredPrompt = null;
        } else {
          console.log('APP: User dismissed the install prompt');
        }
      });
    } else {
      console.log('APP: Install prompt not available');
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', APP.init);
} else {
  APP.init();
}
