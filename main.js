// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Import Vue and Quasar
    const { createApp } = Vue;
    const { createRouter, createWebHashHistory } = VueRouter;
    const { Quasar } = Quasar;
    const { createPinia } = Pinia;

    // Create app instance
    const app = createApp({
      template: '<router-view></router-view>'
    });

    // Configure Quasar
    app.use(Quasar, {
      config: {
        brand: {
          primary: '#1976D2',
          secondary: '#26A69A',
          accent: '#9C27B0',
          dark: '#1D1D1D',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037'
        }
      }
    });

    // Initialize Pinia for state management
    const pinia = createPinia();
    app.use(pinia);

    // Configure router
    const router = createRouter({
      history: createWebHashHistory('/vite/'),
      routes: [
        {
          path: '/',
          component: () => import('./src/layouts/MainLayout.js'),
          children: [
            { path: '', component: () => import('./src/pages/PageEntries.js') },
            { path: 'settings', component: () => import('./src/pages/PageSettings.js') }
          ]
        }
      ]
    });

    // Navigation guard example
    router.beforeEach((to, from, next) => {
      console.log(`Navigating to: ${to.path}`);
      next();
    });

    // Mount the app
    app.use(router).mount('#q-app');

    // Handle app mounted
    const handleAppMounted = () => {
      const loading = document.getElementById('loading');
      const qApp = document.getElementById('q-app');

      if (loading) {
        loading.style.display = 'none';
      }
      if (qApp) {
        qApp.style.opacity = '1';
      }

      console.log('Application mounted successfully');
    };

    // Use nextTick to ensure DOM is updated
    app.config.globalProperties.$nextTick(() => {
      handleAppMounted();
    });

  } catch (error) {
    console.error('Error initializing application:', error);
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ffebee;
      color: #b71c1c;
      padding: 1rem;
      z-index: 9999;
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    errorDiv.textContent = 'Error initializing application. Please refresh the page.';
    document.body.prepend(errorDiv);
  }
});

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  return true; // Prevent default error handler
};

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});