import { createRouter, createWebHashHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import PageEntries from '../pages/PageEntries.vue';
import PageSettings from '../pages/PageSettings.vue';
import ErrorNotFound from '../pages/ErrorNotFound.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: PageEntries
      },

      {
        path: 'settings',
        name: 'settings',
        component: PageSettings
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: ErrorNotFound
  }
];

const router = createRouter({
  history: createWebHashHistory('/vite/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  }
});

export default router;
