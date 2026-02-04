// Main application entry point for CDN-based Quasar app

// Router setup
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        component: PageEntries
      },
      {
        path: 'settings',
        component: PageSettings
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: {
      template: `
        <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
          <div>
            <div style="font-size: 30vh">
              404
            </div>
            <div class="text-h2" style="opacity:.4">
              Oops. Nothing here...
            </div>
            <q-btn
              class="q-mt-xl"
              color="white"
              text-color="blue"
              unelevated
              to="/"
              label="Go Home"
              no-caps
            />
          </div>
        </div>
      `
    }
  }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
})

// Vue app setup
const app = Vue.createApp({
  template: `
    <router-view />
  `
})

app.use(router)
app.use(Quasar, {
  config: {
    brand: {
      primary: '#00695c',
      secondary: '#26A69A',
      accent: '#9C27B0',
      dark: '#1D1D1D',
      positive: '#7eb004',
      negative: '#D73F01',
      info: '#31CCEC',
      warning: '#F2C037'
    }
  }
})

// Hide loading screen and show app
app.mount('#q-app')

// Remove loading screen after app mounts
setTimeout(() => {
  const loading = document.getElementById('loading')
  const qApp = document.getElementById('q-app')

  if (loading) {
    loading.style.display = 'none'
  }

  if (qApp) {
    qApp.style.display = 'block'
  }
}, 100)
