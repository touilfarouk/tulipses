// Router configuration using window components
const routes = [
  {
    path: '/',
    component: window.MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: window.PageEntries
      },
      {
        path: 'tables-demo',
        name: 'tables-demo',
        component: window.TablesDemo
      },
      {
        path: 'advanced-data-grid',
        name: 'advanced-data-grid',
        component: window.AdvancedDataGrid
      },

      {
        path: 'page-multi-grid',
        name: 'page-multi-grid',
        component: window.PageMultiGrid
      },
      {
        path: 'form-entries',
        name: 'form-entries',
        component: window.PageFormEntries
      },
      {
        path: 'settings',
        name: 'settings',
        component: window.PageSettings
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: { template: '<div>Page not found</div>' }
  }
];

// Create and export router factory function
export function createAppRouter(basePath = '/tulipses/') {
  const router = createRouter({
    history: createWebHashHistory(basePath),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return savedPosition || { top: 0 };
    }
  });

  return router;
}
