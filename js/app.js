const APP = {
  sw: null,
  deferredPrompt: null,
  isOnline: 'onLine' in navigator && navigator.onLine,
  isStandalone: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone,
  BASE_PATH: '/tulipses/',
  navCount: 0,

  // Initialize the application
  init: function() {
    console.log('APP: Initializing PWA features');

    // Register service worker
    this.registerSW();

    // Add event listeners
    this.addListeners();

    // Check for install prompt after delay
    setTimeout(() => this.checkNavCount(), 5000);

    // Initial UI update
    this.updateUI();
  },

  // Register Service Worker
  registerSW: function() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    // Get the correct path for the service worker
    const swUrl = new URL('sw.js', window.location.origin + this.BASE_PATH).href;
    console.log('Registering Service Worker at:', swUrl);

    // Register the service worker
    navigator.serviceWorker.register(swUrl, {
      scope: this.BASE_PATH,
      updateViaCache: 'none' // Always check for updates
    })
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
      this.sw = registration.active || registration.installing || registration.waiting;

      // Check for updates immediately
      registration.update().catch(err => {
        console.warn('Service Worker update check failed:', err);
      });

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New Service Worker found in state:', newWorker.state);

        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state changed to:', newWorker.state);

          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content is available; please refresh.');
          }
        });
      });

      return navigator.serviceWorker.ready;
    })
    .then(registration => {
      console.log('Service Worker ready, active:', registration.active);
      this.sw = registration.active;

      // Check if the service worker is controlling the page
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker is controlling the page');
      } else {
        console.log('Page is not yet controlled by a Service Worker');
      }
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);

      // Provide more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    });
  },

  // Add event listeners
  addListeners: function() {
    // Network status
    window.addEventListener('online', () => this.changeStatus({ type: 'online' }));
    window.addEventListener('offline', () => this.changeStatus({ type: 'offline' }));

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.gotMessage(event);
      });
    }

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('Install prompt deferred');
    });

    // Navigation count
    window.addEventListener('pageshow', () => this.updateNavCount());
  },

  // Update UI based on online/offline status
  updateUI: function() {
    this.changeDisplay();
  },

  // Handle network status changes
  changeStatus: function(ev) {
    this.isOnline = ev ? ev.type === 'online' : navigator.onLine;
    console.log('Connection status changed to:', this.isOnline ? 'online' : 'offline');
    this.changeDisplay();

    // Notify service worker about status change
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_STATUS',
        isOnline: this.isOnline
      });
    }
  },

  // Update the display based on online/offline status
  changeDisplay: function() {
    const onlineElement = document.querySelector('.isonline');

    if (this.isOnline) {
      document.body.classList.remove('offline');
      if (onlineElement) onlineElement.textContent = '';
    } else {
      document.body.classList.add('offline');
      if (onlineElement) onlineElement.textContent = ' OFFLINE ';
    }
  },

  // Handle messages from service worker
  gotMessage: function(ev) {
    console.log('Message from Service Worker:', ev.data);

    // Handle different message types
    switch (ev.data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache has been updated');
        break;
      case 'OFFLINE_READY':
        console.log('Offline support is ready');
        break;
      // Add more message types as needed
    }
  },

  // Send message to service worker
  sendMessage: function(msg) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
      console.log('Message sent to Service Worker:', msg);
    } else {
      console.warn('No active Service Worker to send message to');
    }
  },

  // Update navigation count for install prompt
  updateNavCount: function() {
    if (!this.isStandalone) {
      const storage = sessionStorage.getItem('TulipesNavCount');
      this.navCount = storage ? Number(storage) + 1 : 1;
      sessionStorage.setItem('TulipesNavCount', this.navCount);
      console.log('Navigation count:', this.navCount);
    }
  },

  // Check if we should show the install prompt
  checkNavCount: function() {
    if (this.isStandalone) return;

    const storage = sessionStorage.getItem('TulipesNavCount');
    if (storage) {
      this.navCount = Number(storage);
      if (this.navCount > 2 && this.deferredPrompt) {
        console.log('Showing install prompt');

        const showPrompt = () => {
          if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then(choiceResult => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                // Reset the deferred prompt variable
                this.deferredPrompt = null;
                // Clear the navigation count
                sessionStorage.removeItem('TulipesNavCount');
              } else {
                console.log('User dismissed the install prompt');
              }
            });
          }
        };

        // Show prompt on next user interaction
        const handleInteraction = () => {
          showPrompt();
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
        };

        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
      }
    }
  }
};

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => APP.init());
} else {
  // In case the document is already loaded
  setTimeout(() => APP.init(), 0);
}
